import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getUserGames } from "../controllers/games.js";
import {
  getUserById,
  getUsers,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyUser,
} from "../controllers/users.js";

// Interfaces pour les paramètres de route
interface UserIdParams {
  id: string;
}

interface TokenParams {
  token: string;
}

// Interfaces pour les corps de requête
interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

interface ResetPasswordBody {
  newPassword: string;
}

interface EmailBody {
  email: string;
}

export function usersRoutes(app: FastifyInstance, blacklistedTokens: string[]) {
  // Login
  app.post<{
    Body: LoginBody
  }>("/api/login", async (request, reply) => {
    const response = await loginUser(request.body, app);
    if ('error' in response) {
      reply.status(response.code).send(response);
    } else {
      reply.send(response);
    }
  });

  // Logout
  app.post(
    "/api/logout",
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        blacklistedTokens.push(token);
      }
      reply.send({ logout: true });
    }
  );

  // Register
  app.post<{
    Body: RegisterBody
  }>("/api/register", async (request, reply) => {
    const response = await registerUser(request.body, app.bcrypt);
    if ('error' in response) {
      reply.status(response.code).send(response);
    } else {
      reply.send(response);
    }
  });

  // Liste des utilisateurs
  app.get(
    "/api/users",
    { preHandler: [app.authenticate] },
    async (_request, reply) => {
      reply.send(await getUsers());
    }
  );

  // Récupérer un utilisateur par ID
  app.get<{
    Params: UserIdParams
  }>(
    "/api/users/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      reply.send(await getUserById(request.params.id));
    }
  );

  // Récupérer les parties d'un utilisateur
  app.get<{
    Params: UserIdParams
  }>(
    "/api/users/:id/games",
    async (request, reply) => {
      reply.send(await getUserGames(request.params.id));
    }
  );

  // Vérifier l'email de l'utilisateur
  app.get<{
    Params: TokenParams
  }>(
    "/api/verify/:token",
    async (request, reply) => {
      const response = await verifyUser(request.params.token);
      if ('error' in response) {
        reply.status(response.code).send(response);
      } else {
        reply.send(response);
      }
    }
  );

  // Vérifier le token JWT
  app.get(
    "/api/auth/verify",
    async (request, reply) => {
      const bearer = request.headers.authorization;
      if (!bearer) {
        reply.status(401).send({ error: "Token manquant" });
        return;
      }
      const token = bearer.split(" ")[1];
      if (blacklistedTokens.includes(token)) {
        reply.status(401).send({ error: "Token invalide ou expiré" });
        return;
      }
      try {
        const decoded = app.jwt.verify(token);
        reply.send(decoded);
      } catch (error) {
        reply.status(401).send({ error: "Token invalide" });
      }
    }
  );

  // Demande de réinitialisation de mot de passe
  app.post<{
    Body: EmailBody
  }>(
    "/api/password-reset-request",
    async (request, reply) => {
      const { email } = request.body;
      const response = await requestPasswordReset(email);
      if ('error' in response) {
        reply.status(response.code).send(response);
      } else {
        reply.send(response);
      }
    }
  );

  // Réinitialisation de mot de passe
  app.post<{
    Params: TokenParams;
    Body: ResetPasswordBody
  }>(
    "/api/password-reset/:token",
    async (request, reply) => {
      const { token } = request.params;
      const { newPassword } = request.body;
      const response = await resetPassword(token, newPassword, app.bcrypt);
      if ('error' in response) {
        reply.status(response.code).send(response);
      } else {
        reply.send(response);
      }
    }
  );
} 