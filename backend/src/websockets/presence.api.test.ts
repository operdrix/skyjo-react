import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { GameType } from "../../../shared/types.ts";
import { closeApp, connectPlayer, type TestPlayer, createPlayer, nextEvent, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;
let bob: TestPlayer;
const sockets: Socket[] = [];

// Délai de grâce des tests (PRESENCE_GRACE_MS dans vitest.config.ts), avec une marge
const AFTER_GRACE_MS = Number(process.env.PRESENCE_GRACE_MS) + 300;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function getGame(gameId: string) {
  return (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
}

async function aliceAndBobGame({ start = false } = {}) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await act("join", gameId, bob);
  if (start) await act("start", gameId, alice);
  return gameId;
}

// Socket entré dans la room de la partie
async function joinRoom(player: TestPlayer, room: string) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  await nextEvent(socket, "connect");
  expect(await socket.emitWithAck("player-joined-game", { room })).toEqual({ ok: true });
  return socket;
}

// Événements reçus par un socket
function collect(socket: Socket, event: string) {
  const received: GameType[] = [];
  socket.on(event, (game: GameType) => received.push(game));
  return received;
}

const bobStatus = (game: GameType) => game.players.find((player) => player.id === bob.id)?.game_players.status;

describe("présence des joueurs", () => {
  it("garde dans le salon un joueur qui revient avant la fin du délai de grâce", async () => {
    const gameId = await aliceAndBobGame();
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);
    const left = collect(aliceSocket, "player-left-game");

    bobSocket.close();
    await joinRoom(bob, gameId);
    await wait(AFTER_GRACE_MS);

    expect(left).toEqual([]);
    expect((await getGame(gameId)).players.map(({ id }) => id)).toContain(bob.id);
  });

  it("retire du salon un joueur qui ne revient pas, après le délai de grâce", async () => {
    const gameId = await aliceAndBobGame();
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);
    const left = collect(aliceSocket, "player-left-game");

    bobSocket.close();
    await wait(Number(process.env.PRESENCE_GRACE_MS) / 2);
    expect(left).toEqual([]);
    await wait(AFTER_GRACE_MS);

    expect(left).toHaveLength(1);
    expect(left[0].players.map(({ id }) => id)).toEqual([alice.id]);
  });

  it("marque déconnecté, en cours de partie, un joueur qui ne revient pas", async () => {
    const gameId = await aliceAndBobGame({ start: true });
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);
    const left = nextEvent<GameType>(aliceSocket, "player-left-game");

    bobSocket.close();

    expect(bobStatus(await left)).toBe("disconnected");
    const back = nextEvent<GameType>(aliceSocket, "player-joined-game");
    await joinRoom(bob, gameId);
    expect(bobStatus(await back)).toBe("connected");
  });

  it("ne change rien quand un joueur ferme un onglet en double", async () => {
    const gameId = await aliceAndBobGame({ start: true });
    const aliceSocket = await joinRoom(alice, gameId);
    const bobTab = await joinRoom(bob, gameId);
    await joinRoom(bob, gameId);
    const left = collect(aliceSocket, "player-left-game");

    bobTab.close();
    await wait(AFTER_GRACE_MS);

    expect(left).toEqual([]);
    expect(bobStatus(await getGame(gameId))).toBe("connected");
  });
});
