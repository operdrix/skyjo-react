import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { GameData, NextGame } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
import {
  closeApp,
  connectPlayer,
  type TestPlayer,
  createPlayer,
  nextEvent,
  setupApp,
  storedGameData,
} from "../../test/helpers.ts";

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

function act(action: string, gameId: string, player: TestPlayer) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload: {} });
}

// Partie d'Alice (créatrice), avec Bob si demandé, en attente
async function pendingGame({ withBob = true } = {}) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  if (withBob) await act("join", gameId, bob);
  return gameId;
}

// Socket d'un joueur entré dans la room de la partie
async function joinRoom(player: TestPlayer, room: string) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  await nextEvent(socket, "connect");
  expect(await socket.emitWithAck("player-joined-game", { room })).toEqual({ ok: true });
  return socket;
}

async function setGameData(gameId: string, changes: Partial<GameData>) {
  const gameData = { ...(await storedGameData(gameId)), ...changes };
  await db.update(games).set({ gameData }).where(eq(games.id, gameId));
  return gameData;
}

// Partie terminée, avec les joueurs qui veulent rejouer
async function finishedGame(playersPlayAgain: string[]) {
  const gameId = await pendingGame();
  await act("start", gameId, alice);
  await db.update(games).set({ state: "finished", playersPlayAgain }).where(eq(games.id, gameId));
  return gameId;
}

const refused = { ok: false, message: expect.any(String) };

describe("contrôles d'état de la partie", () => {
  it("refuse de redistribuer pendant une manche en cours", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);
    const during = await setGameData(gameId, { currentStep: "draw" });
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("start-game", { room: gameId })).toMatchObject(refused);
    expect((await act("start", gameId, alice)).statusCode).toBe(400);
    expect(await storedGameData(gameId)).toEqual(during);
  });

  it("distribue la manche suivante en fin de manche", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);
    await setGameData(gameId, { currentStep: "endGame" });
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("start-game", { room: gameId })).toEqual({ ok: true });
    expect((await storedGameData(gameId)).currentStep).toBe("initialReveal");
  });

  it("refuse de lancer une partie seul", async () => {
    const gameId = await pendingGame({ withBob: false });
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("start-game", { room: gameId })).toMatchObject(refused);
    expect((await act("start", gameId, alice)).statusCode).toBe(400);
    const [game] = await db.select({ state: games.state }).from(games).where(eq(games.id, gameId));
    expect(game.state).toBe("pending");
  });

  it("refuse une 3e révélation initiale", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);
    const socket = await joinRoom(alice, gameId);
    await socket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 0 });
    await socket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 1 });

    expect(await socket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 2 })).toMatchObject(
      refused,
    );
    expect((await storedGameData(gameId)).playersCards[alice.id][2].revealed).toBe(false);
  });

  it("refuse de relancer une partie qui n'est pas terminée", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);
    await db
      .update(games)
      .set({ playersPlayAgain: [alice.id, bob.id] })
      .where(eq(games.id, gameId));
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("restart-game", { room: gameId })).toMatchObject(refused);
  });

  it("refuse de relancer sans autre joueur qui veut rejouer", async () => {
    const gameId = await finishedGame([alice.id]);
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("restart-game", { room: gameId })).toMatchObject(refused);
  });

  it("ne crée qu'une nouvelle partie quand le créateur relance deux fois", async () => {
    const gameId = await finishedGame([alice.id, bob.id]);
    const socket = await joinRoom(alice, gameId);
    const countGames = async () => (await db.select({ id: games.id }).from(games)).length;
    const before = await countGames();

    const first = nextEvent<NextGame>(socket, "go-to-new-game");
    expect(await socket.emitWithAck("restart-game", { room: gameId })).toEqual({ ok: true });
    const second = nextEvent<NextGame>(socket, "go-to-new-game");
    expect(await socket.emitWithAck("restart-game", { room: gameId })).toEqual({ ok: true });

    expect((await second).gameId).toBe((await first).gameId);
    expect(await countGames()).toBe(before + 1);
    // La nouvelle partie est privée : son id ne fuit pas dans la lecture de l'ancienne
    const old = await app.inject({ method: "GET", url: `/api/game/${gameId}` });
    expect(old.json()).not.toHaveProperty("nextGameId");
  });
});
