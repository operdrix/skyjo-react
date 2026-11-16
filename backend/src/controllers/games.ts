import { and, asc, eq, getTableColumns, inArray, sql, type SQL } from "drizzle-orm";
import type { BotLevel, ErrorType, GameData, GameType, Intent, NextGame, StoredGame } from "../../../shared/types.ts";
import { db, type Db, type Tx } from "../db/index.ts";
import { gamePlayers, games, users } from "../db/schema.ts";
import { chooseIntent } from "../game/bots.ts";
import { applyIntent } from "../game/moves.ts";
import * as rules from "../game/rules.ts";
import { hideCards } from "../game/view.ts";
import { logger } from "../utils/logger.ts";

type Executor = Db | Tx;
export type GameAction = "join" | "leave" | "start" | "finish";
export type GameActionBody = { userId?: string; winner?: string; winnerScore?: number } | null | undefined;
export type GamesQuery = { userId?: string; state?: GameType["state"]; privateRoom?: string; creatorId?: string };

const CREATOR_ONLY = { error: "Seul le créateur de la partie peut faire cela.", code: 403 };

const isError = <T extends object>(value: T | ErrorType): value is ErrorType => "error" in value;

// Partie telle qu'envoyée aux joueurs : les cartes non révélées sont masquées
function toPublic({ nextGameId: _, ...game }: StoredGame): GameType {
  return game.gameData ? { ...game, gameData: hideCards(game.gameData) } : (game as unknown as GameType);
}

// Seuls attributs de joueur exposés dans les réponses de partie
// (invité oublié : son pseudo libéré reste affiché, gardé dans name)
const PUBLIC_USER = {
  id: users.id,
  username: sql<string>`coalesce(${users.username}, ${users.name})`,
  isAnonymous: users.isAnonymous,
  isBot: users.isBot,
  botLevel: users.botLevel,
};

// Partie avec ses joueurs et son créateur, au format attendu par le front.
// Requêtes simples plutôt que l'API relationnelle de Drizzle : ses LEFT JOIN LATERAL ne passent pas sur MariaDB.
async function findGames(executor: Executor, where?: SQL, withGameData = true): Promise<StoredGame[]> {
  const { gameData, ...summaryColumns } = getTableColumns(games);
  const rows = await executor
    .select(withGameData ? { ...summaryColumns, gameData } : summaryColumns)
    .from(games)
    .where(where);
  if (!rows.length) {
    return [];
  }

  const gameIds = rows.map((row) => row.id);
  const creatorIds = [...new Set(rows.map((row) => row.creator))];
  const [players, creators] = await Promise.all([
    executor
      .select({ gamePlayer: gamePlayers, user: PUBLIC_USER })
      .from(gamePlayers)
      .innerJoin(users, eq(users.id, gamePlayers.userId))
      .where(inArray(gamePlayers.gameId, gameIds))
      .orderBy(asc(gamePlayers.createdAt)),
    executor.select(PUBLIC_USER).from(users).where(inArray(users.id, creatorIds)),
  ]);

  return rows.map(
    (game) =>
      ({
        ...game,
        creatorPlayer: creators.find((creator) => creator.id === game.creator) ?? null,
        players: players
          .filter(({ gamePlayer }) => gamePlayer.gameId === game.id)
          .map(({ user, gamePlayer }) => ({ ...user, game_players: gamePlayer })),
      }) as unknown as StoredGame,
  );
}

async function loadGame(gameId: string, executor: Executor = db): Promise<StoredGame | null> {
  const [game] = await findGames(executor, eq(games.id, gameId));
  return game ?? null;
}

// Liste des parties avec filtres
export async function getGames(query: GamesQuery) {
  const { userId, state, privateRoom, creatorId } = query;

  const conditions: SQL[] = [];
  if (state) {
    conditions.push(eq(games.state, state));
  }
  if (privateRoom) {
    conditions.push(eq(games.private, privateRoom === "true"));
  }
  const memberId = userId ?? creatorId;
  if (memberId) {
    const memberGames = db.select({ id: gamePlayers.gameId }).from(gamePlayers).where(eq(gamePlayers.userId, memberId));
    conditions.push(inArray(games.id, memberGames));
  }

  return (await findGames(db, conditions.length ? and(...conditions) : undefined)).map(toPublic);
}

// Liste des parties d'un joueur, sans les données de jeu
export async function getUserGames(userId: string) {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    columns: { id: true, isAnonymous: true },
  });
  if (!user) {
    return { error: "L'utilisateur n'existe pas.", code: 404 };
  }
  if (user.isAnonymous) {
    return { error: "Les invités n'ont pas d'historique.", code: 403 };
  }
  const memberGames = db.select({ id: gamePlayers.gameId }).from(gamePlayers).where(eq(gamePlayers.userId, userId));
  return (await findGames(db, inArray(games.id, memberGames), false)).map(toPublic);
}

// Supprimer une partie
export async function deleteGame(gameId: string, userId: string) {
  const game = await db.query.games.findFirst({ where: eq(games.id, gameId), columns: { creator: true } });

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.creator !== userId) {
    return { error: "Seul le créateur de la partie peut la supprimer.", code: 403 };
  }

  await db.delete(games).where(eq(games.id, gameId));
  return { gameDestroyed: true };
}

// Consulter une partie
export async function getGame(gameId: string): Promise<GameType | ErrorType> {
  const game = await loadGame(gameId);
  return game ? toPublic(game) : { error: "La partie n'existe pas.", code: 404 };
}

// Créer une nouvelle partie, le créateur en est le premier joueur
export async function createGame(userId: string | undefined, privateRoom = false, executor: Executor = db) {
  if (!userId) {
    return { error: "L'identifiant du créateur est manquant", code: 400 };
  }
  const [{ id: gameId }] = await executor
    .insert(games)
    .values({ creator: userId, private: privateRoom })
    .$returningId();
  await executor.insert(gamePlayers).values({ gameId, userId });
  logger.debug("[game controller] ID de la partie créée :", gameId);

  return { gameId };
}

// Mettre à jour une partie (joindre, quitter, démarrer, terminer)
// body.userId est l'utilisateur qui agit : il rejoint ou quitte, et doit être le créateur pour démarrer
// ou terminer (absent uniquement pour les appels internes, comme le démarrage d'une partie relancée)
export async function updateGame(request: { params: { action: string; gameId: string }; body?: GameActionBody }) {
  const { action, gameId } = request.params;
  const body = request.body ?? {};
  const userId = body.userId;

  logger.debug(`Update game ${gameId} with action ${action} for user ${userId}`);

  if ((action === "join" || action === "leave") && !userId) {
    return { error: "L'identifiant du joueur est manquant", code: 400 };
  }

  // Verrou sur la partie : join, leave et start ne s'entrelacent pas
  // (sinon un joueur retiré pendant le démarrage garde des cartes)
  return db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (!game) {
      return { error: "La partie n'existe pas.", code: 404 };
    }
    const result = await applyGameAction(tx, game, action, body);
    return result ?? toPublic((await loadGame(gameId, tx))!);
  });
}

async function lockGame(tx: Tx, gameId: string) {
  await tx.select({ id: games.id }).from(games).where(eq(games.id, gameId)).for("update");
  return loadGame(gameId, tx);
}

// Applique l'action ; renvoie une erreur, ou rien si la partie a été mise à jour
async function applyGameAction(tx: Tx, game: StoredGame, action: string, body: NonNullable<GameActionBody>) {
  if (game.state === "finished") {
    return { error: "Cette partie est déjà terminée !", code: 400 };
  }
  const userId = body.userId!;
  if ((action === "start" || action === "finish") && userId && userId !== game.creator) {
    return CREATOR_ONLY;
  }
  const isPlayer = game.players.some((player) => player.id === userId);
  const player = and(eq(gamePlayers.gameId, game.id), eq(gamePlayers.userId, userId));

  switch (action) {
    case "join":
      if (game.state !== "pending") {
        if (isPlayer) {
          await tx.update(gamePlayers).set({ status: "connected" }).where(player);
        }
        return;
      }
      if (game.players.length >= game.maxPlayers) {
        return { error: `Cette partie est déjà complète avec ${game.maxPlayers} joueurs !` };
      }
      if (isPlayer) {
        return { error: "Vous êtes déjà dans cette partie.", code: 400 };
      }
      await tx.insert(gamePlayers).values({ gameId: game.id, userId });
      return;

    case "leave":
      if (game.state === "pending") {
        await tx.delete(gamePlayers).where(player);
      } else if (isPlayer) {
        await tx.update(gamePlayers).set({ status: "disconnected" }).where(player);
      }
      return;

    case "start":
      if (game.state === "playing" && game.gameData.currentStep !== "endGame") {
        return { error: "Une manche est déjà en cours.", code: 400 };
      }
      if (game.players.length < 2) {
        return { error: "Il faut au moins 2 joueurs pour lancer la partie.", code: 400 };
      }
      await tx
        .update(games)
        .set({
          state: "playing",
          roundNumber: game.roundNumber + 1,
          gameData: rules.dealCards(game.players.map((player) => player.id)),
        })
        .where(eq(games.id, game.id));
      return;

    case "finish":
      if (!body.winnerScore || !body.winner) {
        return { error: "Le score et le gagnant doivent être fournis.", code: 400 };
      }
      await tx
        .update(games)
        .set({ state: "finished", winner: body.winner, winnerScore: body.winnerScore })
        .where(eq(games.id, game.id));
      return;

    default:
      logger.warn("Unknown action");
      return { error: "Action inconnue", code: 400 };
  }
}

// Mettre à jour les paramètres d'une partie
export async function updateGameSettings(
  gameId: string,
  settings: { maxPlayers?: number; private?: boolean },
  userId: string,
) {
  const game = await db.query.games.findFirst({ where: eq(games.id, gameId), columns: { state: true, creator: true } });

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.creator !== userId) {
    return CREATOR_ONLY;
  }

  if (game.state !== "pending") {
    return { error: "Impossible de modifier les paramètres d'une partie en cours.", code: 403 };
  }

  const { maxPlayers, private: privateRoom } = settings;
  await db.update(games).set({ maxPlayers, private: privateRoom }).where(eq(games.id, gameId));
  return toPublic((await loadGame(gameId))!);
}

// Joue le coup voulu par un joueur de la partie, calculé sur l'état enregistré : fait avancer la partie ;
// en fin de manche, enregistre les scores et termine la partie si un joueur atteint le score maximum
export async function playMove(gameId: string, intent: Intent, userId: string) {
  return applyMove(gameId, (current, game) => {
    const isPlayer = game.players.some((player) => player.id === userId);
    return isPlayer ? applyIntent(current, userId, intent) : null;
  });
}

// Applique un coup calculé à partir des données courantes, lues sous verrou
// (null : coup invalide, rien n'est enregistré)
async function applyMove(gameId: string, move: (current: GameData, game: StoredGame) => GameData | null) {
  return db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    const gameData = game && move(game.gameData, game);
    if (!game || !gameData) {
      return null;
    }

    rules.advanceGame(gameData);
    const update: Partial<typeof games.$inferInsert> = { gameData };

    if (gameData.currentStep === "endGame") {
      const totals = await saveScores(tx, game, gameData);
      const { finished, winner, winnerScore } = rules.checkMaximumScore(totals);
      if (finished) {
        // Les robots sont toujours partants pour rejouer
        const bots = game.players.filter((player) => player.isBot).map((player) => player.id);
        Object.assign(update, { state: "finished", winner, winnerScore, playersPlayAgain: bots });
      }
    }

    await tx.update(games).set(update).where(eq(games.id, gameId));
    return toPublic((await loadGame(gameId, tx))!);
  });
}

// Ajoute les scores de la manche aux joueurs, renvoie les totaux
async function saveScores(tx: Tx, game: StoredGame, gameData: GameData) {
  const roundScores = rules.computeRoundScores(gameData);
  const totals: rules.Scores = {};

  for (const { id, game_players: current } of game.players) {
    const score = roundScores[id] ?? 0;
    totals[id] = current.score + score;
    await tx
      .update(gamePlayers)
      .set({ score: totals[id], scoreByRound: [...current.scoreByRound, score] })
      .where(and(eq(gamePlayers.gameId, game.id), eq(gamePlayers.userId, id)));
  }
  return totals;
}

// Ajoute un joueur de la partie à ceux qui veulent rejouer (null s'il n'en fait pas partie)
export async function addPlayerPlayAgain(gameId: string, userId: string) {
  return db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (!game?.players.some((player) => player.id === userId)) {
      return null;
    }
    if (!game.playersPlayAgain.includes(userId)) {
      await tx
        .update(games)
        .set({ playersPlayAgain: [...game.playersPlayAgain, userId] })
        .where(eq(games.id, gameId));
    }
    return toPublic((await loadGame(gameId, tx))!);
  });
}

// Nouvelle partie privée, démarrée, avec le créateur et les joueurs qui ont demandé à rejouer.
// Une seule par partie terminée : une nouvelle demande renvoie celle déjà créée.
export async function restartGame(gameId: string): Promise<NextGame | ErrorType> {
  return db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (!game) {
      return { error: "La partie n'existe pas.", code: 404 };
    }
    const players = game.playersPlayAgain;
    if (game.nextGameId) {
      return { gameId: game.nextGameId, players };
    }
    if (game.state !== "finished") {
      return { error: "La partie n'est pas terminée.", code: 400 };
    }
    const others = players.filter((playerId) => playerId !== game.creator);
    if (!others.length) {
      return { error: "Il faut au moins un autre joueur qui veut rejouer.", code: 400 };
    }

    const created = await createGame(game.creator, true, tx);
    if (isError(created)) {
      return created;
    }
    await tx.insert(gamePlayers).values(others.map((userId) => ({ gameId: created.gameId, userId })));
    await tx
      .update(games)
      .set({ state: "playing", roundNumber: 1, gameData: rules.dealCards([game.creator, ...others]) })
      .where(eq(games.id, created.gameId));
    await tx.update(games).set({ nextGameId: created.gameId }).where(eq(games.id, game.id));
    return { gameId: created.gameId, players };
  });
}

// ─── Robots ──────────────────────────────────────────────────────────────────

// Robots disponibles par niveau : de quoi remplir une table de 8 avec un seul humain
const BOTS_PER_LEVEL = 7;

const botId = (level: BotLevel, rank: number) => `robot-${level}-${rank}`;

// Crée le compte du robot au premier besoin (sans pseudo ni moyen de connexion : il ne peut pas se connecter)
async function ensureBot(tx: Tx, level: BotLevel, rank: number) {
  const id = botId(level, rank);
  await tx
    .insert(users)
    .values({
      id,
      name: rank === 1 ? `Robot ${level}` : `Robot ${level} ${rank}`,
      email: `${id}@robots.invalid`,
      isBot: true,
      botLevel: level,
    })
    .onDuplicateKeyUpdate({ set: { isBot: true } });
  return id;
}

// Le créateur ajoute un robot du niveau voulu, dans la salle d'attente et s'il reste une place
export async function addBot(gameId: string, level: BotLevel): Promise<GameType | ErrorType> {
  return db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (!game) {
      return { error: "La partie n'existe pas.", code: 404 };
    }
    if (game.state !== "pending") {
      return { error: "Les robots s'ajoutent dans la salle d'attente.", code: 400 };
    }
    if (game.players.length >= game.maxPlayers) {
      return { error: `Cette partie est déjà complète avec ${game.maxPlayers} joueurs !`, code: 400 };
    }
    const taken = new Set(game.players.map((player) => player.id));
    const rank = Array.from({ length: BOTS_PER_LEVEL }, (_, index) => index + 1).find(
      (candidate) => !taken.has(botId(level, candidate)),
    );
    if (!rank) {
      return { error: "Plus de robot disponible pour ce niveau.", code: 400 };
    }
    const userId = await ensureBot(tx, level, rank);
    await tx.insert(gamePlayers).values({ gameId, userId });
    return toPublic((await loadGame(gameId, tx))!);
  });
}

// Le créateur retire un robot de la salle d'attente
export async function removeBot(gameId: string, botUserId: string): Promise<GameType | ErrorType> {
  return db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (!game) {
      return { error: "La partie n'existe pas.", code: 404 };
    }
    if (game.state !== "pending") {
      return { error: "Les robots se retirent dans la salle d'attente.", code: 400 };
    }
    if (!game.players.some((player) => player.id === botUserId && player.isBot)) {
      return { error: "Ce joueur n'est pas un robot de la partie.", code: 400 };
    }
    await tx.delete(gamePlayers).where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, botUserId)));
    return toPublic((await loadGame(gameId, tx))!);
  });
}

// Robot qui doit jouer : pendant la révélation initiale, le premier qui n'a pas révélé ses 2 cartes ;
// sinon celui dont c'est le tour
function botToPlay(gameData: GameData, game: StoredGame) {
  const bots = game.players.filter((player) => player.isBot);
  if (gameData.currentStep === "initialReveal") {
    return bots.find((bot) => gameData.playersCards[bot.id]?.filter((card) => card.revealed).length < 2);
  }
  return bots.find((bot) => bot.id === gameData.currentPlayer);
}

// Au moins un humain de la partie est là (un joueur parti n'est marqué déconnecté qu'après le délai de grâce)
const hasHumanPresent = (game: StoredGame) =>
  game.players.some((player) => !player.isBot && player.game_players.status === "connected");

// Joue un geste du robot qui doit jouer, sous verrou, à partir de la vue masquée de la partie
// (celle de tous les joueurs). Renvoie la partie à jour, ou null si aucun robot n'a à jouer :
// sans humain présent, les robots attendent son retour.
export async function playBotMove(gameId: string): Promise<GameType | null> {
  return applyMove(gameId, (current, game) => {
    if (game.state !== "playing" || !hasHumanPresent(game)) return null;
    const bot = botToPlay(current, game);
    if (!bot) return null;
    const intent = chooseIntent(hideCards(current), bot.id, bot.botLevel ?? "facile");
    return intent && applyIntent(current, bot.id, intent);
  });
}
