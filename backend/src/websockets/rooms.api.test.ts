import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { GameType } from "../../../shared/types.ts";
import { closeApp, connectPlayer, type TestPlayer, createPlayer, nextEvent, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;
let bob: TestPlayer;
let carol: TestPlayer;
const sockets: Socket[] = [];

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  bob = await createPlayer(app, "bob");
  carol = await createPlayer(app, "carol");
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

// Partie en attente créée par Alice, avec Bob
async function aliceAndBobGame() {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
  return gameId;
}

// Entre dans la room de la partie et attend la diffusion de l'arrivée
async function enterRoom(socket: Socket, room: string) {
  const joined = nextEvent<GameType>(socket, "player-joined-game");
  socket.emit("player-joined-game", { room });
  return joined;
}

// Collecte les parties reçues pour un événement
function collect(socket: Socket, event: string) {
  const received: GameType[] = [];
  socket.on(event, (game: GameType) => received.push(game));
  return received;
}

// Laisse aux diffusions en cours le temps d'arriver
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

describe("rooms des parties", () => {
  it("refuse l'entrée dans la room à un compte qui n'est pas joueur de la partie", async () => {
    const gameId = await aliceAndBobGame();
    const aliceSocket = await connect(alice);
    await enterRoom(aliceSocket, gameId);
    const carolSocket = await connect(carol);
    const carolUpdates = collect(carolSocket, "update-game-params");

    const response = await carolSocket.emitWithAck("player-joined-game", { room: gameId });
    expect(response).toMatchObject({ ok: false, message: expect.any(String) });

    const aliceUpdate = nextEvent(aliceSocket, "update-game-params");
    aliceSocket.emit("update-game-params", { room: gameId });
    await aliceUpdate;
    await settle();
    expect(carolUpdates).toEqual([]);
  });

  it("quitte la room de l'ancienne partie en entrant dans une nouvelle", async () => {
    const first = await aliceAndBobGame();
    const second = await aliceAndBobGame();
    const aliceSocket = await connect(alice);
    await enterRoom(aliceSocket, first);
    const bobSocket = await connect(bob);
    await enterRoom(bobSocket, first);
    await enterRoom(bobSocket, second);
    const bobUpdates = collect(bobSocket, "update-game-params");

    const aliceUpdate = nextEvent(aliceSocket, "update-game-params");
    aliceSocket.emit("update-game-params", { room: first });
    await aliceUpdate;
    await settle();
    expect(bobUpdates).toEqual([]);
  });

  it("à la déconnexion, ne quitte que la partie courante", async () => {
    const first = await aliceAndBobGame();
    const second = await aliceAndBobGame();
    const aliceSocket = await connect(alice);
    await enterRoom(aliceSocket, second);
    const bobSocket = await connect(bob);
    await enterRoom(bobSocket, first);
    await enterRoom(bobSocket, second);

    const left = nextEvent<GameType>(aliceSocket, "player-left-game");
    bobSocket.close();
    await left;

    const players = async (gameId: string) =>
      (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>().players.map(({ id }) => id);
    expect(await players(second)).toEqual([alice.id]);
    expect(await players(first)).toContain(bob.id);
  });
});
