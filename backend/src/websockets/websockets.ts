import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { Socket } from "socket.io";
import type { Ack, ClientEvent, ClientPayloads, GameType, MoveType } from "../../../shared/types.ts";
import {
  addPlayerPlayAgain,
  getGame,
  playMove as savePlayMove,
  restartGame as createNextGame,
  updateGame,
} from "../controllers/games.ts";
import { logger } from "../utils/logger.ts";
import type { GameSocket } from "./types.ts";

const INVALID_DATA = "Données invalides";
const SESSION_EXPIRED = "Session expirée, reconnecte-toi";
const SERVER_ERROR = "Erreur du serveur, réessaie";
const MOVE_REFUSED = "Coup refusé";
const CREATOR_ONLY = "Seul le créateur de la partie peut faire cela";
const NOT_A_PLAYER = "Tu ne fais pas partie de cette partie";
const GAME_NOT_FOUND = "La partie n'existe pas.";

// Contrôle de chaque champ attendu des événements client
type Check = (value: unknown) => boolean;
const MOVES: MoveType[] = ["draw", "take-discard", "discard-drawn", "replace", "flip", "reveal"];
const text: Check = (value) => typeof value === "string" && value !== "";
const move: Check = (value) => MOVES.includes(value as MoveType);
const optionalIndex: Check = (value) => value === undefined || Number.isInteger(value);

const CLIENT_FIELDS: { [E in ClientEvent]: Record<keyof ClientPayloads[E], Check> } = {
  "player-joined-game": { room: text },
  "update-game-params": { room: text },
  "start-game": { room: text },
  "restart-game": { room: text },
  "player-play-again": { room: text },
  "play-move": { room: text, move, cardIndex: optionalIndex },
};

// Résultat d'un handler : rien si l'action est acceptée, sinon le motif du refus
type Refusal = string | void;

// Joueur de la session portée par les cookies du handshake (null sans session ou sans pseudo)
async function sessionPlayer(socket: Socket, app: FastifyInstance) {
  const session = await app.auth.api.getSession({ headers: fromNodeHeaders(socket.handshake.headers) });
  const username = session?.user.username;
  return session && username ? { id: session.user.id, username } : null;
}

// Vérifie chaque champ attendu (les champs en trop sont ignorés : seuls les champs contrôlés sont lus)
function isValid<E extends ClientEvent>(event: E, data: unknown): data is ClientPayloads[E] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const checks: Record<string, Check> = CLIENT_FIELDS[event];
  return Object.entries(checks).every(([field, check]) => check((data as Record<string, unknown>)[field]));
}

// Enregistre un handler : validation des données et de la session, puis accusé de réception
function on<E extends ClientEvent>(
  socket: GameSocket,
  app: FastifyInstance,
  event: E,
  handler: (data: ClientPayloads[E]) => Promise<Refusal>,
) {
  // Écoute non typée : les données sont validées avant d'être passées au handler typé
  (socket as Socket).on(event as string, async (data: unknown, ack?: (response: Ack) => void) => {
    // Un ancien client peut émettre sans accusé
    const reply = (response: Ack) => typeof ack === "function" && ack(response);

    if (!isValid(event, data)) {
      reply({ ok: false, message: INVALID_DATA });
      return;
    }
    if (!(await sessionPlayer(socket as Socket, app))) {
      reply({ ok: false, message: SESSION_EXPIRED, reason: "session-expired" });
      socket.disconnect();
      return;
    }
    try {
      const refusal = await handler(data);
      reply(refusal ? { ok: false, message: refusal } : { ok: true });
    } catch (error) {
      logger.error(`[${event}]`, error);
      reply({ ok: false, message: SERVER_ERROR });
    }
  });
}

// Message d'erreur renvoyé par le contrôleur, s'il y en a un
const errorOf = (result: object): Refusal => ("error" in result ? String(result.error) : undefined);

// Partie de la room si l'émetteur en est le créateur
async function creatorGame(socket: GameSocket, room: string): Promise<GameType | null> {
  const game = await getGame(room);
  return "error" in game || game.creator !== socket.data.userId ? null : game;
}

export async function websockets(app: FastifyInstance) {
  await app.ready();
  const io = app.io;

  // Middleware d'authentification pour les WebSocket
  io.use(async (socket, next) => {
    try {
      const player = await sessionPlayer(socket, app);
      if (!player) {
        logger.error("WebSocket: session absente ou pseudo non choisi");
        return next(new Error("Session absente"));
      }
      socket.data.userId = player.id;
      socket.data.username = player.username;
      logger.info(`WebSocket: User authenticated - ${player.username} (${player.id})`);
      next();
    } catch (err) {
      logger.error("WebSocket authentication error:", (err as Error).message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, username } = socket.data;
    logger.info(`Joueur connecté : ${username} (${userId}) - socket: ${socket.id}`);

    // Un joueur entre dans la room d'une partie dont il est joueur
    on(socket, app, "player-joined-game", async ({ room: gameId }) => {
      let game = await getGame(gameId);
      if ("error" in game) return GAME_NOT_FOUND;
      // Seuls les joueurs de la partie en suivent les mises à jour
      if (!game.players.some((player) => player.id === userId)) return NOT_A_PLAYER;
      if (game.state !== "pending") {
        await updateGame({ params: { action: "join", gameId }, body: { userId } });
        game = await getGame(gameId);
        if ("error" in game) return GAME_NOT_FOUND;
      }

      // Une seule room de partie par socket : on quitte la précédente
      const previous = socket.data.room;
      if (previous && previous !== gameId) {
        socket.leave(previous);
      }
      socket.join(gameId);
      socket.data.room = gameId;
      io.to(gameId).emit("player-joined-game", game);
    });

    // Les paramètres de la partie ont changé
    on(socket, app, "update-game-params", async ({ room }) => {
      const game = await creatorGame(socket, room);
      if (!game) return CREATOR_ONLY;
      io.to(game.id).emit("update-game-params", game);
    });

    // Démarrer une partie
    on(socket, app, "start-game", async ({ room: gameId }) => {
      if (!(await creatorGame(socket, gameId))) return CREATOR_ONLY;
      io.to(gameId).emit("waiting-deal");
      const started = await updateGame({ params: { action: "start", gameId }, body: { userId } });
      const refusal = errorOf(started);
      if (refusal) return refusal;
      io.to(gameId).emit("start-game", started as GameType);
    });

    // Un joueur annonce son coup ; le serveur le calcule sur l'état enregistré
    on(socket, app, "play-move", async ({ room, move, cardIndex }) => {
      const game = await savePlayMove(room, { move, cardIndex }, userId);
      if (!game) return MOVE_REFUSED;
      io.to(game.id).emit("play-move", game);
    });

    // L'émetteur veut rejouer
    on(socket, app, "player-play-again", async ({ room }) => {
      const game = await addPlayerPlayAgain(room, userId);
      if (!game) return MOVE_REFUSED;
      io.to(game.id).emit("play-again", game);
    });

    // Nouvelle partie avec les joueurs qui ont demandé à rejouer
    on(socket, app, "restart-game", async ({ room: gameId }) => {
      if (!(await creatorGame(socket, gameId))) return CREATOR_ONLY;
      io.to(gameId).emit("waiting-deal");
      const next = await createNextGame(gameId);
      if (!next) return GAME_NOT_FOUND;
      io.to(gameId).emit("go-to-new-game", next);
    });

    // Un joueur qui se déconnecte quitte la partie
    socket.on("disconnect", async () => {
      logger.info(`Joueur déconnecté : ${username} (${userId}) - socket: ${socket.id}`);
      const room = socket.data.room;
      if (!room) return;
      await updateGame({ params: { action: "leave", gameId: room }, body: { userId } });
      const game = await getGame(room);
      if (!("error" in game)) {
        io.to(room).emit("player-left-game", game);
      }
    });
  });
}
