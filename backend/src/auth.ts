import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { anonymous, username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { freeGuestUsername, linkGuestAccount, restoreGuestUsername } from "./controllers/users.ts";
import { db } from "./db/index.ts";
import * as schema from "./db/schema.ts";
import { logger } from "./utils/logger.ts";
import { frontendOrigins } from "./utils/origins.ts";
import { renderTemplate, sendMail } from "./utils/mailer.ts";

// Pseudo : lettres (accents compris), chiffres, espace, point, tiret, souligné
const USERNAME_PATTERN = /^[\p{L}\p{N} ._-]+$/u;

export const AUTH_BASE_URL = process.env.APP_URL || "http://localhost:3000";

// Thèmes d'affichage proposés (voir docs/DESIGN.md)
export const THEMES = ["tapis", "neon", "confettis"];

export const USERNAME_REQUIRED = "Choisissez un pseudo pour jouer";

// Connexion Google si les identifiants OAuth sont fournis
function googleProvider() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.warn("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET absents : connexion Google désactivée");
    return {};
  }
  return {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // Seul le prénom est gardé (il sert à proposer un pseudo), pas la photo
      mapProfileToUser: (profile: { given_name?: string; name?: string }) => ({
        name: profile.given_name || profile.name || "",
        image: undefined,
      }),
    },
  };
}

// Authentification : email + mot de passe ou Google, sessions en base (cookies httpOnly)
export function createAuth(secret: string) {
  return betterAuth({
    secret,
    baseURL: AUTH_BASE_URL,
    basePath: "/api/auth",
    trustedOrigins: frontendOrigins(process.env.FRONTEND_HOST),
    database: drizzleAdapter(db, { provider: "mysql", schema }),
    user: {
      modelName: "users",
      // Droit à l'effacement : sans mot de passe, Better Auth exige une connexion de moins de 24 h
      deleteUser: { enabled: true },
      // Thème d'affichage : choisi à l'inscription, modifiable via update-user
      additionalFields: {
        theme: { type: "string", required: false, defaultValue: "tapis", input: true },
      },
    },
    session: { modelName: "sessions" },
    account: {
      modelName: "accounts",
      // Google garantit l'email : un compte email/mot de passe existant est relié automatiquement
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    verification: { modelName: "verifications" },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        const html = await renderTemplate("reset-password", { username: user.name, confirmLink: url });
        await sendMail(user.email, "Réinitialisation de mot de passe", html);
      },
    },
    socialProviders: googleProvider(),
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameValidator: (value) => USERNAME_PATTERN.test(value),
        // Pas de passage en minuscules : l'unicité insensible à la casse vient de la collation MySQL
        usernameNormalization: false,
        displayUsername: false,
      }),
      // Invités : session sans compte, le pseudo est choisi juste après (update-user).
      // Un invité qui crée son compte (ou se connecte) garde ses parties
      anonymous({
        onLinkAccount: ({ anonymousUser, newUser }) => linkGuestAccount(anonymousUser.user.id, newUser.user.id),
      }),
    ],
    databaseHooks: {
      session: {
        create: {
          // Chaque connexion repousse la suppression automatique des comptes inactifs
          after: async (session) => {
            await db.update(schema.users).set({ lastActiveAt: new Date() }).where(eq(schema.users.id, session.userId));
          },
        },
      },
    },
    hooks: {
      // Le pseudo est obligatoire à l'inscription par email (avec Google, il est choisi juste après)
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email" && !ctx.body?.username) {
          throw new APIError("BAD_REQUEST", { message: "Le pseudo est obligatoire" });
        }
        // Un invité qui s'inscrit peut garder son pseudo : il est libéré le temps de l'inscription
        if (ctx.path === "/sign-up/email") {
          const session = await getSessionFromCtx(ctx, { disableRefresh: true });
          if (session?.user.isAnonymous) await freeGuestUsername(session.user.id, ctx.body.username);
        }
        const theme = ctx.body?.theme;
        if (
          (ctx.path === "/sign-up/email" || ctx.path === "/update-user") &&
          theme !== undefined &&
          !THEMES.includes(theme)
        ) {
          throw new APIError("BAD_REQUEST", { message: "Thème inconnu" });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const session = await getSessionFromCtx(ctx, { disableRefresh: true });
          const guestId = session?.user.isAnonymous ? session.user.id : null;
          if (guestId) await restoreGuestUsername(guestId, Boolean(ctx.context.newSession));
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
