import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeApp, createPlayer, findSensitiveFields, setupApp } from "../../test/helpers.ts";

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
  const { messages } = await search.json() as { messages: { ID: string }[] };
  expect(messages.length).toBeGreaterThan(0);
  const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
  return await message.json() as { Subject: string; HTML: string };
}

describe("inscription et connexion", () => {
  const email = `dora-${Date.now()}@test.local`;
  const credentials = { email, password: "secret-de-test" };

  it("inscrit un joueur et lui envoie le lien de vérification par mail", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/register",
      payload: { firstname: "Dora", lastname: "Explo", username: "dora", ...credentials },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().username).toBe("dora");

    const mail = await lastMailTo(email);
    expect(mail.Subject).toBe("Confirmation d'inscription");
    expect(mail.HTML).toMatch(/\/auth\/verify\/[0-9a-f]{64}/);
  });

  it("refuse la connexion tant que le compte n'est pas vérifié", async () => {
    const response = await app.inject({ method: "POST", url: "/api/login", payload: credentials });

    expect(response.statusCode).toBe(400);
  });

  it("connecte le joueur après vérification via le lien reçu", async () => {
    const mail = await lastMailTo(email);
    const [token] = mail.HTML.match(/(?<=\/auth\/verify\/)[0-9a-f]{64}/) ?? [];

    const verify = await app.inject({ method: "GET", url: `/api/verify/${token}` });
    expect(verify.statusCode).toBe(200);
    expect(findSensitiveFields(verify.json())).toEqual([]);

    const login = await app.inject({ method: "POST", url: "/api/login", payload: credentials });
    expect(login.statusCode).toBe(200);
    expect(login.cookies.map(cookie => cookie.name)).toEqual(
      expect.arrayContaining(["accessToken", "refreshToken"]),
    );
    expect(findSensitiveFields(login.json().user).filter(field => field !== ".email")).toEqual([]);
  });
});

describe("profil", () => {
  it("expose le meilleur score sous le nom bestScore", async () => {
    const erin = await createPlayer(app, "erin");

    const response = await app.inject({ method: "GET", url: `/api/users/${erin.id}`, cookies: erin.cookies });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: erin.id, username: "erin", bestScore: null });
    expect(response.json()).not.toHaveProperty("bestScrore");
  });
});
