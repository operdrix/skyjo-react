import { io as connectClient, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeApp, cookieHeader, type TestPlayer, createPlayer, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let alice: TestPlayer;
let url: string;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  url = await app.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
  await closeApp(app);
});

// Ouvre une connexion socket et attend la connexion ou l'erreur
function connect(cookie?: string): Promise<{ socket: Socket; error: Error | null }> {
  const socket = connectClient(url, {
    transports: ["websocket"],
    reconnection: false,
    extraHeaders: cookie ? { cookie } : {},
  });
  return new Promise((resolve) => {
    socket.on("connect", () => resolve({ socket, error: null }));
    socket.on("connect_error", (error) => resolve({ socket, error }));
  });
}

describe("websockets", () => {
  it("accepte un joueur connecté via son cookie de session", async () => {
    const { socket, error } = await connect(cookieHeader(alice));
    socket.close();
    expect(error).toBeNull();
  });

  it("refuse une connexion sans cookie", async () => {
    const { socket, error } = await connect();
    socket.close();
    expect(error?.message).toBe("Session absente");
  });
});
