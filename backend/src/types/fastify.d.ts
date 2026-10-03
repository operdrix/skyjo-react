import type { FastifyReply } from "fastify";
import type { Server } from "socket.io";
import type { Auth } from "../auth.ts";

// Décorations ajoutées par buildApp()
declare module "fastify" {
  interface FastifyInstance {
    auth: Auth;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    io: Server;
  }

  // Joueur connecté, renseigné par authenticate
  interface FastifyRequest {
    user: { id: string; username: string };
  }
}
