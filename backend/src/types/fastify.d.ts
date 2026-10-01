import type { FastifyReply, FastifyRequest } from "fastify";
import type { Server } from "socket.io";
import type { PasswordHasher } from "../controllers/users.ts";

// Décorations ajoutées par buildApp()
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    bcrypt: PasswordHasher;
    io: Server;
  }
}

// Contenu des jetons d'accès et de rafraîchissement
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; username: string; email?: string };
    user: { id: string; username: string; email?: string };
  }
}
