import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeApp, findSensitiveFields, setupApp } from "../../test/helpers.js";

const MAILPIT_URL = "http://localhost:8025";

let app;

beforeAll(async () => {
  app = await setupApp();
});

afterAll(async () => {
  await closeApp(app);
});

// Dernier mail reçu par Mailpit pour cette adresse
async function lastMailTo(email) {
  const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
  const { messages } = await search.json();
  expect(messages.length).toBeGreaterThan(0);
  const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
  return message.json();
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
    const [token] = mail.HTML.match(/(?<=\/auth\/verify\/)[0-9a-f]{64}/);

    const verify = await app.inject({ method: "GET", url: `/api/verify/${token}` });
    expect(verify.statusCode).toBe(200);

    const login = await app.inject({ method: "POST", url: "/api/login", payload: credentials });
    expect(login.statusCode).toBe(200);
    expect(login.cookies.map(cookie => cookie.name)).toEqual(
      expect.arrayContaining(["accessToken", "refreshToken"]),
    );
    expect(findSensitiveFields(login.json().user).filter(field => field !== ".email")).toEqual([]);
  });
});
