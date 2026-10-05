import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { GameData, GameType } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { games, sessions } from "../db/schema.ts";
import { closeApp, connectPlayer, type TestPlayer, createPlayer, nextEvent, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;
let bob: TestPlayer;
const sockets: Socket[] = [];

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

async function aliceAndBobGame({ start = false } = {}) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
  if (start) {
    await app.inject({ method: "PATCH", url: `/api/game/start/${gameId}`, cookies: alice.cookies, payload: {} });
  }
  return gameId;
}

describe("accusés de réception des événements", () => {
  it("accuse réception d'un événement accepté", async () => {
    const gameId = await aliceAndBobGame();
    const socket = await connect(alice);

    expect(await socket.emitWithAck("player-joined-game", { room: gameId })).toEqual({ ok: true });
  });

  it.each([
    ["player-joined-game", { room: { $ne: "" } }],
    ["player-joined-game", "partie"],
    ["play-move", { room: "partie", move: "voler" }],
    ["play-move", { room: "partie", move: "flip", cardIndex: "2" }],
    ["play-move", { room: "partie" }],
  ])("refuse « %s » avec des données mal formées %j", async (event, data) => {
    const socket = await connect(alice);

    expect(await socket.emitWithAck(event, data)).toEqual({ ok: false, message: "Données invalides" });
  });

  it("renvoie un accusé d'échec quand le traitement plante", async () => {
    const gameId = await aliceAndBobGame({ start: true });
    const { gameData } = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
    // Partie corrompue en base : la pioche est vide, piocher plante
    const turn: GameData = { ...gameData, currentStep: "draw", currentPlayer: alice.id, deckCards: [] };
    await db.update(games).set({ gameData: turn }).where(eq(games.id, gameId));
    const socket = await connect(alice);

    const response = await socket.emitWithAck("play-move", { room: gameId, move: "draw" });

    expect(response).toMatchObject({ ok: false, message: expect.any(String) });
  });

  it("signale une session expirée et ferme la connexion", async () => {
    const gameId = await aliceAndBobGame();
    const carol = await createPlayer(app, "carol");
    const socket = await connect(carol);
    await db.delete(sessions).where(eq(sessions.userId, carol.id));
    const closed = nextEvent(socket, "disconnect");

    const response = await socket.emitWithAck("player-joined-game", { room: gameId });

    expect(response).toEqual({ ok: false, message: expect.any(String), reason: "session-expired" });
    await closed;
  });
});
