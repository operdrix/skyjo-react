import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
import { closeApp, connectPlayer, type TestPlayer, createPlayer, nextEvent, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;
let bob: TestPlayer;
const sockets: Socket[] = [];

// Le serveur diffuse sans attente artificielle : bien moins d'une seconde en local
const MAX_DELAY_MS = 500;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  bob = await createPlayer(app, "bob");
  url = await app.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
  sockets.forEach((socket) => socket.close());
  await closeApp(app);
});

async function connect(player: TestPlayer) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  await nextEvent(socket, "connect");
  return socket;
}

async function aliceAndBobGame() {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
  return gameId;
}

// Durée entre l'émission d'un événement et la réception de la réponse attendue
async function elapsed(socket: Socket, emitted: string, data: object, expected: string) {
  const start = Date.now();
  const received = nextEvent(socket, expected);
  socket.emit(emitted, data);
  await received;
  return Date.now() - start;
}

describe("diffusions sans attente artificielle", () => {
  it("diffuse l'arrivée d'un joueur immédiatement", async () => {
    const gameId = await aliceAndBobGame();
    const socket = await connect(alice);

    expect(await elapsed(socket, "player-joined-game", { room: gameId }, "player-joined-game")).toBeLessThan(
      MAX_DELAY_MS,
    );
  });

  it("diffuse le lancement d'une manche immédiatement", async () => {
    const gameId = await aliceAndBobGame();
    const socket = await connect(alice);
    const joined = nextEvent(socket, "player-joined-game");
    socket.emit("player-joined-game", { room: gameId });
    await joined;

    expect(await elapsed(socket, "start-game", { room: gameId }, "start-game")).toBeLessThan(MAX_DELAY_MS);
  });

  it("diffuse la nouvelle partie immédiatement", async () => {
    const gameId = await aliceAndBobGame();
    await db
      .update(games)
      .set({ state: "finished", playersPlayAgain: [alice.id, bob.id] })
      .where(eq(games.id, gameId));
    const socket = await connect(alice);
    const joined = nextEvent(socket, "player-joined-game");
    socket.emit("player-joined-game", { room: gameId });
    await joined;

    expect(await elapsed(socket, "restart-game", { room: gameId }, "go-to-new-game")).toBeLessThan(MAX_DELAY_MS);
  });
});
