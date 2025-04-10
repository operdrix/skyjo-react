import { FastifyInstance } from 'fastify';
import {
  createGame,
  deleteGame,
  getGame,
  getGames,
  updateGame,
  updateGameSettings
} from "../controllers/games.js";

// Interfaces pour les paramètres de route
interface GameIdParams {
  gameId: string;
}

interface GameActionParams extends GameIdParams {
  action: string;
}

// Interfaces pour les corps de requête
interface CreateGameBody {
  userId: string;
  privateRoom: boolean;
}

interface GameSettingsBody {
  maxPlayers?: number;
  private?: boolean;
  [key: string]: any;
}

export function gamesRoutes(app: FastifyInstance) {
  // Liste des parties
  app.get<{
    Querystring: {
      userId?: string;
      state?: string;
      privateRoom?: string;
      creatorId?: string;
    }
  }>(
    "/api/games",
    async (request, reply) => {
      const response = await getGames(request.query);
      reply.send(response);
    }
  );

  // Consulter une partie
  app.get<{
    Params: GameIdParams
  }>(
    "/api/game/:gameId",
    async (request, reply) => {
      const response = await getGame(request.params.gameId);
      if ('error' in response) {
        reply.status(response.code).send(response);
      } else {
        reply.send(response);
      }
    }
  );

  // Création d'une partie
  app.post<{
    Body: CreateGameBody
  }>(
    "/api/game",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const response = await createGame(request.body.userId, request.body.privateRoom);
      if ('error' in response) {
        reply.status(response.code || 400).send(response);
      } else {
        reply.send(response);
      }
    }
  );

  // Rejoindre/quitter/démarrer/terminer une partie
  app.patch<{
    Params: GameActionParams;
    Body: {
      userId?: string;
      winnerScore?: number;
      winner?: string;
      [key: string]: any;
    }
  }>(
    "/api/game/:action/:gameId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const gameRequest = {
        params: request.params,
        body: request.body
      };

      const response = await updateGame(gameRequest);
      if ('error' in response) {
        reply.status(response.code || 400).send(response);
      } else {
        reply.send(response);
      }
    }
  );

  // Mettre à jour les paramètres d'une partie
  app.patch<{
    Params: GameIdParams;
    Body: GameSettingsBody
  }>(
    "/api/game/:gameId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const response = await updateGameSettings(request.params.gameId, request.body);
      if ('error' in response) {
        reply.status(response.code).send(response);
      } else {
        reply.send(response);
      }
    }
  );

  // Supprimer une partie
  app.delete<{
    Params: GameIdParams
  }>(
    "/api/game/:gameId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      // Récupérer l'ID de l'utilisateur authentifié
      const user = request.user as { id: string } | undefined;

      if (!user) {
        reply.status(401).send({ error: "Utilisateur non authentifié", code: 401 });
        return;
      }

      const response = await deleteGame(request.params.gameId, user.id);
      if ('error' in response) {
        reply.status(response.code).send(response);
      } else {
        reply.send(response);
      }
    }
  );
} 