import type { FastifyReply } from "fastify";
import type { Auth } from "../auth.ts";
import type { GameServer } from "../websockets/types.ts";

// Décorations ajoutées par buildApp()
declare module "fastify" {
  interface FastifyInstance {
    auth: Auth;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    io: GameServer;
  }

  // Joueur connecté, renseigné par authenticate
  interface FastifyRequest {
    user: { id: string; username: string; isAnonymous: boolean };
  }
}
