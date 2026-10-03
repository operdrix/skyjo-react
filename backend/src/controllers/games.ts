import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import type { ErrorType, GameData, GameType } from "../../../shared/types.ts";
import { db, type Db, type Tx } from "../db/index.ts";
import { gamePlayers, games } from "../db/schema.ts";
import * as rules from "../game/rules.ts";
import { logger } from "../utils/logger.ts";

type Executor = Db | Tx;
export type GameAction = "join" | "leave" | "start" | "finish";
export type GameActionBody = { userId?: string; winner?: string; winnerScore?: number } | null | undefined;
export type GamesQuery = { userId?: string; state?: GameType["state"]; privateRoom?: string; creatorId?: string };

const CREATOR_ONLY = { error: "Seul le créateur de la partie peut faire cela.", code: 403 };

const isError = <T extends object>(value: T | ErrorType): value is ErrorType => "error" in value;

// Seuls attributs de joueur exposés dans les réponses de partie
const PUBLIC_USER = { columns: { id: true, username: true } } as const;

// Partie avec ses joueurs et son créateur, au format attendu par le front
function findGames(executor: Executor, where?: SQL, withGameData = true) {
  return executor.query.games.findMany({
    where,
    columns: withGameData ? undefined : { gameData: false },
    with: {
      creatorPlayer: PUBLIC_USER,
      players: { with: { user: PUBLIC_USER }, orderBy: [asc(gamePlayers.createdAt)] },
    },
  });
}

type GameRow = Awaited<ReturnType<typeof findGames>>[number];

function toGameType(row: GameRow): GameType {
  const { players, creatorPlayer, ...game } = row;
  return {
    ...game,
    creatorPlayer,
    players: players.map(({ user, ...gamePlayer }) => ({ ...user, game_players: gamePlayer })),
  } as unknown as GameType;
}

async function loadGame(gameId: string, executor: Executor = db): Promise<GameType | null> {
  const [row] = await findGames(executor, eq(games.id, gameId));
  return row ? toGameType(row) : null;
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

  const rows = await findGames(db, conditions.length ? and(...conditions) : undefined);
  return rows.map(toGameType);
}

// Liste des parties d'un joueur, sans les données de jeu
export async function getUserGames(userId: string) {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    columns: { id: true },
  });
  if (!user) {
    return { error: "L'utilisateur n'existe pas.", code: 404 };
  }
  const memberGames = db.select({ id: gamePlayers.gameId }).from(gamePlayers).where(eq(gamePlayers.userId, userId));
  const rows = await findGames(db, inArray(games.id, memberGames), false);
  return rows.map(toGameType);
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
  return game ?? { error: "La partie n'existe pas.", code: 404 };
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
    return result ?? (await loadGame(gameId, tx))!;
  });
}

async function lockGame(tx: Tx, gameId: string) {
  await tx.select({ id: games.id }).from(games).where(eq(games.id, gameId)).for("update");
  return loadGame(gameId, tx);
}

// Applique l'action ; renvoie une erreur, ou rien si la partie a été mise à jour
async function applyGameAction(tx: Tx, game: GameType, action: string, body: NonNullable<GameActionBody>) {
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
  return (await loadGame(gameId))!;
}

// Enregistre un coup du joueur dont c'est le tour : fait avancer la partie ; en fin de manche,
// enregistre les scores et termine la partie si un joueur atteint le score maximum
export async function playMove(gameId: string, gameData: GameData, userId: string) {
  return applyMove(gameId, (current, game) => {
    const isPlayer = game.players.some((player) => player.id === userId);
    return isPlayer && current.currentPlayer === userId ? gameData : null;
  });
}

// Applique un coup calculé à partir des données courantes, lues sous verrou
// (null : coup invalide, rien n'est enregistré)
async function applyMove(gameId: string, move: (current: GameData, game: GameType) => GameData | null) {
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
        Object.assign(update, { state: "finished", winner, winnerScore });
      }
    }

    await tx.update(games).set(update).where(eq(games.id, gameId));
    return (await loadGame(gameId, tx))!;
  });
}

// Ajoute les scores de la manche aux joueurs, renvoie les totaux
async function saveScores(tx: Tx, game: GameType, gameData: GameData) {
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

// Révèle une carte pendant la phase de révélation initiale
export async function revealInitialCard(gameId: string, playerId: string, cardId: string) {
  return applyMove(gameId, (gameData) => {
    const card = gameData.playersCards?.[playerId]?.find((candidate) => candidate.id === cardId);
    if (!card) {
      return null;
    }
    card.revealed = true;
    return gameData;
  });
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
    return (await loadGame(gameId, tx))!;
  });
}

// Nouvelle partie privée, démarrée, avec le créateur et les joueurs qui ont demandé à rejouer
export async function restartGame(gameId: string) {
  const game = await loadGame(gameId);
  if (!game) {
    return null;
  }

  const newGameId = await db.transaction(async (tx) => {
    const created = await createGame(game.creator, true, tx);
    if (isError(created)) {
      throw new Error(created.error);
    }
    const others = game.playersPlayAgain.filter((playerId) => playerId !== game.creator);
    if (others.length) {
      await tx.insert(gamePlayers).values(others.map((userId) => ({ gameId: created.gameId, userId })));
    }
    return created.gameId;
  });

  await updateGame({ params: { action: "start", gameId: newGameId } });
  return { gameId: newGameId, players: game.playersPlayAgain };
}
