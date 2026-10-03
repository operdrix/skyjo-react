import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeApp, setupApp } from "../test/helpers.ts";

let app: FastifyInstance;

beforeAll(async () => {
  app = await setupApp();
});

afterAll(async () => {
  await closeApp(app);
});

// Le navigateur envoie un preflight avant chaque PATCH/DELETE vers l'API (autre origine que le front)
describe("CORS", () => {
  it.each(["PATCH", "DELETE"])("autorise %s depuis le front", async (method) => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/api/game/abc",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": method,
        "access-control-request-headers": "content-type",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain(method);
  });
});
