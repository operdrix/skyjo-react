import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { Server, Socket } from "socket.io";
import type { GameData, GameType } from "../../../shared/types.ts";
import {
  addPlayerPlayAgain,
  getGame,
  playMove as savePlayMove,
  restartGame as createNextGame,
  revealInitialCard,
  updateGame,
} from "../controllers/games.ts";
import { logger } from "../utils/logger.ts";

// Données attachées au socket après authentification
export type SocketData = { userId: string; username: string; room?: string };
type GameSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;
type Payload = Record<string, unknown>;

const SESSION_EXPIRED = { message: "Session expirée, veuillez vous reconnecter" };
const MOVE_REFUSED = { message: "Coup refusé" };
const CREATOR_ONLY = { message: "Seul le créateur de la partie peut faire cela" };
const NOT_A_PLAYER = { message: "Tu ne fais pas partie de cette partie" };

// Joueur de la session portée par les cookies du handshake (null sans session ou sans pseudo)
async function sessionPlayer(socket: Socket, app: FastifyInstance) {
  const session = await app.auth.api.getSession({ headers: fromNodeHeaders(socket.handshake.headers) });
  const username = session?.user.username;
  return session && username ? { id: session.user.id, username } : null;
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

// Vérifie que la session est toujours valide, sinon déconnecte le socket
async function verifySession(socket: Socket, app: FastifyInstance) {
  if (await sessionPlayer(socket, app)) {
    return true;
  }
  socket.emit("error", SESSION_EXPIRED);
  socket.disconnect();
  return false;
}

// Enregistre un handler d'événement : validation des champs et de la session avant traitement
function on(
  socket: GameSocket,
  app: FastifyInstance,
  event: string,
  requiredFields: string[],
  handler: (data: Payload) => Promise<void>,
) {
  (socket as Socket).on(event, async (data: unknown) => {
    if (!validateEventData(socket as Socket, data, requiredFields)) return;
    if (!(await verifySession(socket as Socket, app))) return;
    try {
      await handler(data);
    } catch (error) {
      logger.error(`[${event}]`, error);
    }
  });
}

function refuse(socket: GameSocket, error: { message: string }) {
  (socket as Socket).emit("error", error);
}

// Partie de la room si l'émetteur en est le créateur ; sinon refus envoyé à l'émetteur
async function creatorGame(socket: GameSocket, room: string): Promise<GameType | null> {
  const game = await getGame(room);
  if ("error" in game || game.creator !== socket.data.userId) {
    refuse(socket, CREATOR_ONLY);
    return null;
  }
  return game;
}

export async function websockets(app: FastifyInstance) {
  await app.ready();
  const io: Server = app.io;

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

  io.on("connection", (socket: GameSocket) => {
    const { userId, username } = socket.data;
    logger.info(`Joueur connecté : ${username} (${userId}) - socket: ${socket.id}`);

    // Un joueur entre dans la room d'une partie dont il est joueur
    on(socket, app, "player-joined-game", ["room"], async ({ room }) => {
      const gameId = room as string;

      let game = await getGame(gameId);
      if ("error" in game) {
        logger.error("Game not found for room:", gameId);
        return;
      }
      // Seuls les joueurs de la partie en suivent les mises à jour
      if (!game.players.some((player) => player.id === userId)) {
        refuse(socket, NOT_A_PLAYER);
        return;
      }
      if (game.state !== "pending") {
        await updateGame({ params: { action: "join", gameId }, body: { userId } });
        game = await getGame(gameId);
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
    on(socket, app, "update-game-params", ["room"], async ({ room }) => {
      const game = await creatorGame(socket, room as string);
      if (game) {
        io.to(game.id).emit("update-game-params", game);
      }
    });

    // Démarrer une partie
    on(socket, app, "start-game", ["room"], async ({ room }) => {
      const gameId = room as string;
      if (!(await creatorGame(socket, gameId))) return;
      io.to(gameId).emit("waiting-deal");
      await updateGame({ params: { action: "start", gameId }, body: { userId } });
      const game = await getGame(gameId);
      if ("error" in game) return;
      io.to(gameId).emit("start-game", game);
    });

    // Révélation d'une de ses cartes pendant la phase initiale
    on(socket, app, "initial-turn-card", ["room", "cardId"], async ({ room, cardId }) => {
      const game = await revealInitialCard(room as string, userId, cardId as string);
      if (!game) {
        refuse(socket, MOVE_REFUSED);
        return;
      }
      io.to(game.id).emit("play-move", game);
    });

    // Un coup est joué par le joueur dont c'est le tour
    on(socket, app, "play-move", ["room", "gameData"], async ({ room, gameData }) => {
      const game = await savePlayMove(room as string, gameData as GameData, userId);
      if (!game) {
        refuse(socket, MOVE_REFUSED);
        return;
      }
      io.to(game.id).emit("play-move", game);
    });

    // L'émetteur veut rejouer
    on(socket, app, "player-play-again", ["room"], async ({ room }) => {
      const game = await addPlayerPlayAgain(room as string, userId);
      if (!game) {
        refuse(socket, MOVE_REFUSED);
        return;
      }
      io.to(game.id).emit("play-again", game);
    });

    // Nouvelle partie avec les joueurs qui ont demandé à rejouer
    on(socket, app, "restart-game", ["room"], async ({ room }) => {
      const gameId = room as string;
      if (!(await creatorGame(socket, gameId))) return;
      io.to(gameId).emit("waiting-deal");
      const next = await createNextGame(gameId);
      if (!next) return;
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
