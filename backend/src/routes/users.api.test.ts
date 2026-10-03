import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { closeApp, createPlayer, findSensitiveFields, sessionCookies, setupApp } from "../../test/helpers.ts";

const MAILPIT_URL = "http://localhost:8025";

let app: FastifyInstance;

beforeAll(async () => {
  app = await setupApp();
});

afterAll(async () => {
  await closeApp(app);
});

// Dernier mail reçu par Mailpit pour cette adresse
async function lastMailTo(email: string) {
  const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
  const { messages } = (await search.json()) as { messages: { ID: string }[] };
  expect(messages.length).toBeGreaterThan(0);
  const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
  return (await message.json()) as { Subject: string; HTML: string };
}

function signUp(payload: object) {
  return app.inject({ method: "POST", url: "/api/auth/sign-up/email", payload });
}

function signIn(email: string, password: string) {
  return app.inject({ method: "POST", url: "/api/auth/sign-in/email", payload: { email, password } });
}

function createGame(cookies: Record<string, string>) {
  return app.inject({ method: "POST", url: "/api/game", cookies, payload: {} });
}

describe("inscription par email", () => {
  it("connecte le joueur dès l'inscription, sans vérification d'adresse", async () => {
    const response = await signUp({
      email: "dora@test.local",
      password: "secret-de-test",
      name: "dora",
      username: "dora",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user).toMatchObject({ username: "dora" });
    expect((await createGame(sessionCookies(response))).statusCode).toBe(200);
  });

  it("exige un pseudo", async () => {
    const response = await signUp({ email: "sans-pseudo@test.local", password: "secret-de-test", name: "x" });

    expect(response.statusCode).toBe(400);
  });

  it("refuse un pseudo déjà pris, quelle que soit la casse", async () => {
    await createPlayer(app, "fanny");

    const response = await signUp({
      email: "autre@test.local",
      password: "secret-de-test",
      name: "Fanny",
      username: "Fanny",
    });

    expect(response.statusCode).toBe(400);
  });

  it("connecte par email et mot de passe", async () => {
    await createPlayer(app, "gaby");

    const response = await signIn("gaby@test.local", "secret-de-test");

    expect(response.statusCode).toBe(200);
    expect((await createGame(sessionCookies(response))).statusCode).toBe(200);
  });

  it("refuse l'accès au jeu après déconnexion", async () => {
    const hugo = await createPlayer(app, "hugo");

    await app.inject({ method: "POST", url: "/api/auth/sign-out", cookies: hugo.cookies, payload: {} });

    expect((await createGame(hugo.cookies)).statusCode).toBe(401);
  });
});

describe("pseudo à choisir après une première connexion Google", () => {
  it("refuse de jouer tant que le pseudo n'est pas choisi, puis l'accepte", async () => {
    const ines = await createPlayer(app, "ines");
    await db.update(users).set({ username: null }).where(eq(users.id, ines.id));

    expect((await createGame(ines.cookies)).statusCode).toBe(403);

    const update = await app.inject({
      method: "POST",
      url: "/api/auth/update-user",
      cookies: ines.cookies,
      payload: { username: "Inès" },
    });
    expect(update.statusCode).toBe(200);
    expect((await createGame(ines.cookies)).statusCode).toBe(200);
  });
});

describe("mot de passe oublié", () => {
  it("envoie un lien de réinitialisation par mail et accepte le nouveau mot de passe", async () => {
    await createPlayer(app, "jade");

    const request = await app.inject({
      method: "POST",
      url: "/api/auth/request-password-reset",
      payload: { email: "jade@test.local", redirectTo: "http://localhost:5173/auth/password-reset" },
    });
    expect(request.statusCode).toBe(200);

    const mail = await lastMailTo("jade@test.local");
    expect(mail.Subject).toBe("Réinitialisation de mot de passe");
    const [, token] = mail.HTML.match(/\/api\/auth\/reset-password\/([\w-]+)/) ?? [];
    expect(token).toBeTruthy();

    const reset = await app.inject({
      method: "POST",
      url: "/api/auth/reset-password",
      payload: { token, newPassword: "nouveau-secret" },
    });
    expect(reset.statusCode).toBe(200);
    expect((await signIn("jade@test.local", "nouveau-secret")).statusCode).toBe(200);
  });
});

describe("profil", () => {
  it("expose le meilleur score sous le nom bestScore", async () => {
    const erin = await createPlayer(app, "erin");

    const response = await app.inject({ method: "GET", url: `/api/users/${erin.id}`, cookies: erin.cookies });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: erin.id, username: "erin", bestScore: null });
  });

  it("n'expose pas l'email des autres joueurs", async () => {
    const kim = await createPlayer(app, "kim");

    const list = await app.inject({ method: "GET", url: "/api/users", cookies: kim.cookies });
    const one = await app.inject({ method: "GET", url: `/api/users/${kim.id}`, cookies: kim.cookies });

    expect(findSensitiveFields(list.json())).toEqual([]);
    expect(findSensitiveFields(one.json())).toEqual([]);
  });
});
