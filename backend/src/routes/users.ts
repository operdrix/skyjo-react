import type { FastifyInstance } from "fastify";
import { getUserGames } from "../controllers/games.ts";
import { getUserById, getUsers } from "../controllers/users.ts";

type IdParams = { Params: { id: string } };

// Profils publics des joueurs (l'inscription et la connexion passent par Better Auth, /api/auth/*)
export function usersRoutes(app: FastifyInstance) {
  //récupération de la liste des utilisateurs
  app.get(
    "/api/users",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Joueurs"],
        summary: "Liste des utilisateurs",
        description: "Récupère la liste de tous les utilisateurs (authentification requise)",
        security: [{ sessionCookie: [] }],
      },
    },
    async (_request, reply) => {
      reply.send(await getUsers());
    },
  );
  //récupération d'un utilisateur par son id
  app.get<IdParams>(
    "/api/users/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Joueurs"],
        summary: "Détails d'un utilisateur",
        description: "Récupère les informations d'un utilisateur par son ID",
        security: [{ sessionCookie: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID de l'utilisateur" },
          },
        },
      },
    },
    async (request, reply) => {
      reply.send(await getUserById(request.params.id));
    },
  );
  //Récupération des parties d'un utilisateur
  app.get<IdParams>(
    "/api/users/:id/games",
    {
      schema: {
        tags: ["Parties"],
        summary: "Parties d'un utilisateur",
        description: "Récupère toutes les parties d'un utilisateur",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID de l'utilisateur" },
          },
        },
      },
    },
    async (request, reply) => {
      reply.send(await getUserGames(request.params.id));
    },
  );
}
