import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeApp, createPlayer, sessionCookies, setupApp, type TestPlayer } from "../../test/helpers.ts";

let app: FastifyInstance;

beforeEach(async () => {
  if (app) {
    await closeApp(app);
  }
  app = await setupApp();
});

afterAll(async () => {
  await closeApp(app);
});

async function sessionTheme(cookies: Record<string, string>) {
  const response = await app.inject({ method: "GET", url: "/api/auth/get-session", cookies });
  return response.json<{ user: { theme: string } }>().user.theme;
}

function signUp(theme?: string) {
  return app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email: "camille@test.local", password: "secret-de-test", name: "camille", username: "camille", theme },
  });
}

function updateTheme(player: TestPlayer, theme: string) {
  return app.inject({ method: "POST", url: "/api/auth/update-user", cookies: player.cookies, payload: { theme } });
}

describe("thème d'affichage du compte", () => {
  it("vaut Tapis de jeu par défaut", async () => {
    const alice = await createPlayer(app, "alice");
    expect(await sessionTheme(alice.cookies)).toBe("tapis");
  });

  it("se choisit à l'inscription", async () => {
    const response = await signUp("neon");
    expect(response.statusCode).toBe(200);
    expect(await sessionTheme(sessionCookies(response))).toBe("neon");
  });

  it("refuse un thème inconnu à l'inscription", async () => {
    const response = await signUp("cupcake");
    expect(response.statusCode).toBe(400);
  });

  it("se change depuis l'espace perso", async () => {
    const alice = await createPlayer(app, "alice");
    const response = await updateTheme(alice, "confettis");
    expect(response.statusCode).toBe(200);
    expect(await sessionTheme(alice.cookies)).toBe("confettis");
  });

  it("refuse un thème inconnu à la modification", async () => {
    const alice = await createPlayer(app, "alice");
    const response = await updateTheme(alice, "cupcake");
    expect(response.statusCode).toBe(400);
    expect(await sessionTheme(alice.cookies)).toBe("tapis");
  });
});
