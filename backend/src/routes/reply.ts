import type { FastifyReply } from "fastify";

// Réponse d'un contrôleur : erreur `{ error, code? }` (400 par défaut) ou données
export function sendResult(reply: FastifyReply, result: unknown) {
  if (result && typeof result === "object" && "error" in result) {
    const code = "code" in result && typeof result.code === "number" ? result.code : 400;
    return reply.status(code).send(result);
  }
  return reply.send(result);
}
