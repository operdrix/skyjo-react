//pour fastify
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { Server as SocketServer } from "socket.io";
import { AUTH_BASE_URL, createAuth, USERNAME_REQUIRED } from "./auth.ts";
import { frontendOrigins } from "./utils/origins.ts";
//routes
import { gamesRoutes } from "./routes/games.ts";
import { usersRoutes } from "./routes/users.ts";
//websockets
import { websockets } from "./websockets/websockets.ts";
import type { SocketData } from "./websockets/types.ts";
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/types.ts";

// Secret lu dans l'environnement, sans valeur par défaut
function requireSecret(name: "BETTER_AUTH_SECRET") {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`Variable d'environnement ${name} manquante`);
  }
  return secret;
}

// Construit l'application Fastify (plugins, routes, websockets) sans la démarrer
export async function buildApp() {
  /**
   * API
   * avec fastify
   */
  const auth = createAuth(requireSecret("BETTER_AUTH_SECRET"));
  const app = fastify({
    bodyLimit: 1048576, // Limite de 1MB pour éviter les attaques DoS
  });
  app.decorate("auth", auth);
  // Socket.io branché sur le serveur HTTP de Fastify (remplace fastify-socket.io, abandonné)
  app.decorate(
    "io",
    new SocketServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(app.server, {
      cors: {
        origin: frontendOrigins(process.env.FRONTEND_HOST),
        credentials: true,
      },
    }),
  );
  app.addHook("preClose", async () => {
    app.io.local.disconnectSockets(true);
  });
  app.addHook("onClose", async () => {
    await app.io.close();
  });
  await app
    .register(helmet, {
      // Configuration des headers de sécurité
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Pour Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'"], // Pour Swagger UI
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
        },
      },
      // Désactiver X-Powered-By pour ne pas exposer Fastify
      hidePoweredBy: true,
      // Forcer HTTPS en production
      hsts:
        process.env.NODE_ENV === "production"
          ? {
              maxAge: 31536000, // 1 an
              includeSubDomains: true,
              preload: true,
            }
          : false,
    })
    .register(rateLimit, {
      global: false, // Pas de limite globale, on configure par route
      max: 100,
      timeWindow: "1 minute",
      cache: 10000,
      allowList: ["127.0.0.1"], // Pas de limite pour localhost en dev
      skipOnError: true,
    })
    .register(cors, {
      origin: frontendOrigins(process.env.FRONTEND_HOST),
      credentials: true,
      // @fastify/cors 10+ n'autorise plus que GET, HEAD et POST par défaut
      methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
    })
    .register(fastifySwagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: "API SkyJo d'Olivier",
          description: "API du jeu Skyjo développée avec Fastify, Drizzle et Socket.io",
          version: "1.0.0",
          contact: {
            name: "Olivier Perdrix",
            url: "https://labodolivier.com",
          },
        },
        servers: [
          {
            url: process.env.APP_URL || "http://localhost:3000",
            description: process.env.NODE_ENV === "production" ? "Serveur de production" : "Serveur de développement",
          },
        ],
        tags: [
          { name: "Joueurs", description: "Profils publics des joueurs (connexion : Better Auth, /api/auth/*)" },
          { name: "Parties", description: "Gestion des parties de jeu" },
          { name: "Système", description: "Routes système et informations" },
        ],
        components: {
          securitySchemes: {
            // Cookie posé par Better Auth à la connexion (/api/auth/sign-in/email)
            sessionCookie: {
              type: "apiKey",
              in: "cookie",
              name: "better-auth.session_token",
            },
          },
        },
      },
    })
    .register(fastifySwaggerUi, {
      routePrefix: "/api/documentation",
      theme: {
        title: "Documentation API Skyjo d'Olivier",
      },
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, _request, _reply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });
  /**********
   * Routes
   **********/

  app.get(
    "/api",
    {
      schema: {
        tags: ["Système"],
        summary: "Informations sur l'API",
        description: "Retourne l'URL de la documentation Swagger",
        response: {
          200: {
            type: "object",
            properties: {
              documentationURL: { type: "string" },
            },
          },
        },
      },
    },
    (_request, reply) => {
      const apiUrl = process.env.APP_URL || "http://localhost:3000";
      reply.send({ documentationURL: `${apiUrl}/api/documentation` });
    },
  );
  // Better Auth : inscription, connexion (email ou Google), session, pseudo, mot de passe oublié
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    schema: { hide: true },
    async handler(request, reply) {
      const url = new URL(request.url, AUTH_BASE_URL);
      const response = await auth.handler(
        new Request(url, {
          method: request.method,
          headers: fromNodeHeaders(request.headers),
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        }),
      );
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key !== "set-cookie") reply.header(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header("set-cookie", cookies);
      return reply.send(response.body ? await response.text() : null);
    },
  });

  // Exige une session et un pseudo choisi
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
    if (!session) {
      return reply.status(401).send({ error: "Session absente ou expirée" });
    }
    if (!session.user.username) {
      return reply.status(403).send({ error: USERNAME_REQUIRED });
    }
    request.user = { id: session.user.id, username: session.user.username };
  });
  //gestion utilisateur
  usersRoutes(app);
  //gestion des jeux
  gamesRoutes(app);

  /**********
   * Socket.io
   * pour la gestion du jeu
   * **********/
  websockets(app);

  return app;
}
