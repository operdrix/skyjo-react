import type { FastifyInstance } from "fastify";
import type { Server, Socket } from "socket.io";
import type { GameData } from "../../../shared/types.ts";
import {
  getGame,
  playMove as savePlayMove,
  restartGame as createNextGame,
  revealInitialCard,
  setPlayersPlayAgain,
  updateGame,
} from "../controllers/games.ts";
import { logger } from "../utils/logger.ts";

// Données attachées au socket après authentification
export type SocketData = { userId: string; username: string; room?: string };
type GameSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;
type Payload = Record<string, unknown>;

const SESSION_EXPIRED = { message: "Session expirée, veuillez vous reconnecter" };

function readAccessToken(socket: Socket) {
  const cookies = socket.handshake.headers.cookie;
  return cookies?.match(/(?:^|;)\s*accessToken\s*=\s*([^;]+)/)?.[1] ?? null;
}

/**
 * Valide les données d'entrée des événements WebSocket
 */
function validateEventData(socket: Socket, data: unknown, requiredFields: string[]): data is Payload {
  if (!data || typeof data !== "object") {
    socket.emit("error", { message: "Données invalides" });
    return false;
  }

  for (const field of requiredFields) {
    if (!(data as Payload)[field]) {
      socket.emit("error", { message: `Le champ "${field}" est requis` });
      return false;
    }
  }

  return true;
}

/**
 * Vérifie que le token JWT est toujours valide
 */
function verifySocketToken(socket: Socket, app: FastifyInstance) {
  const token = readAccessToken(socket);
  try {
    if (!token) {
      throw new Error("Access token absent");
    }
    app.jwt.verify(token);
    return true;
  } catch (err) {
    logger.error("Token verification failed:", (err as Error).message);
    socket.emit("error", SESSION_EXPIRED);
    socket.disconnect();
    return false;
  }
}

// Enregistre un handler d'événement : validation des champs et du token avant traitement
function on(socket: GameSocket, app: FastifyInstance, event: string, requiredFields: string[], handler: (data: Payload) => Promise<void>) {
  (socket as Socket).on(event, async (data: unknown) => {
    if (!validateEventData(socket as Socket, data, requiredFields)) return;
    if (!verifySocketToken(socket as Socket, app)) return;
    try {
      await handler(data);
    } catch (error) {
      logger.error(`[${event}]`, error);
    }
  });
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function websockets(app: FastifyInstance) {
  await app.ready();
  const io: Server = app.io;

  // Middleware d'authentification pour les WebSocket
  io.use((socket, next) => {
    const token = readAccessToken(socket);
    if (!token) {
      logger.error("WebSocket: accessToken not found in cookies");
      return next(new Error("Authentication token missing"));
    }
    try {
      const decoded = app.jwt.verify<{ id: string; username: string }>(token);
      socket.data.userId = decoded.id;
      socket.data.username = decoded.username;
      logger.info(`WebSocket: User authenticated - ${decoded.username} (${decoded.id})`);
      next();
    } catch (err) {
      logger.error("WebSocket authentication error:", (err as Error).message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: GameSocket) => {
    const { userId, username } = socket.data;
    logger.info(`Joueur connecté : ${username} (${userId}) - socket: ${socket.id}`);

    // Un joueur rejoint une partie (après un délai pour éviter les problèmes de concurrence)
    on(socket, app, "player-joined-game", ["room"], async ({ room }) => {
      const gameId = room as string;
      await wait(1000);

      let game = await getGame(gameId);
      if ("error" in game) {
        logger.error("Game not found for room:", gameId);
        return;
      }
      if (game.state !== "pending") {
        await updateGame({ params: { action: "join", gameId }, body: { userId } });
        game = await getGame(gameId);
      }

      socket.join(gameId);
      socket.data.room = gameId;
      io.to(gameId).emit("player-joined-game", game);
    });

    // Les paramètres de la partie ont changé
    on(socket, app, "update-game-params", ["room"], async ({ room }) => {
      const game = await getGame(room as string);
      if (!("error" in game)) {
        io.to(game.id).emit("update-game-params", game);
      }
    });

    // Démarrer une partie
    on(socket, app, "start-game", ["room"], async ({ room }) => {
      const gameId = room as string;
      io.to(gameId).emit("waiting-deal");
      await updateGame({ params: { action: "start", gameId } });
      const game = await getGame(gameId);
      if ("error" in game) return;
      await wait(3000);
      io.to(gameId).emit("start-game", game);
    });

    // Révélation d'une carte pendant la phase initiale
    on(socket, app, "initial-turn-card", ["room", "playerId", "cardId"], async ({ room, playerId, cardId }) => {
      const game = await revealInitialCard(room as string, playerId as string, cardId as string);
      if (game) {
        io.to(game.id).emit("play-move", game);
      }
    });

    // Un coup est joué
    on(socket, app, "play-move", ["room", "gameData"], async ({ room, gameData }) => {
      const game = await savePlayMove(room as string, gameData as GameData);
      if (game) {
        io.to(game.id).emit("play-move", game);
      }
    });

    // Joueurs prêts à rejouer
    on(socket, app, "player-play-again", ["room", "playersPlayAgain"], async ({ room, playersPlayAgain }) => {
      const game = await setPlayersPlayAgain(room as string, playersPlayAgain as string[]);
      if (game) {
        io.to(game.id).emit("play-again", game);
      }
    });

    // Nouvelle partie avec les joueurs qui ont demandé à rejouer
    on(socket, app, "restart-game", ["room"], async ({ room }) => {
      const gameId = room as string;
      io.to(gameId).emit("waiting-deal");
      const next = await createNextGame(gameId);
      if (!next) return;
      await wait(1000);
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
