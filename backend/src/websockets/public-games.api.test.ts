import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
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

// Compte les signaux de changement de la liste des parties publiques
function countChanges(socket: Socket) {
  const counter = { count: 0 };
  socket.on("public-games-changed", () => counter.count++);
  return counter;
}

// Laisse aux diffusions en cours le temps d'arriver
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

async function createGame(player: TestPlayer) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: player.cookies, payload: {} });
  return created.json<{ gameId: string }>().gameId;
}

describe("liste des parties publiques en temps réel", () => {
  it("accepte le suivi de la liste", async () => {
    const bobSocket = await connect(bob);
    expect(await bobSocket.emitWithAck("watch-public-games", {})).toEqual({ ok: true });
  });

  it("signale aux sockets qui suivent la liste la création d'une partie", async () => {
    const bobSocket = await connect(bob);
    await bobSocket.emitWithAck("watch-public-games", {});

    const changed = nextEvent(bobSocket, "public-games-changed");
    await createGame(alice);
    await changed;
  });

  it("signale l'arrivée, le départ d'un joueur et le changement des paramètres", async () => {
    const gameId = await createGame(alice);
    const bobSocket = await connect(bob);
    await bobSocket.emitWithAck("watch-public-games", {});
    const changes = countChanges(bobSocket);

    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
    await app.inject({ method: "PATCH", url: `/api/game/leave/${gameId}`, cookies: bob.cookies, payload: {} });
    await app.inject({
      method: "PATCH",
      url: `/api/game/${gameId}`,
      cookies: alice.cookies,
      payload: { maxPlayers: 3 },
    });
    await settle();

    expect(changes.count).toBe(3);
  });

  it("signale le lancement d'une partie", async () => {
    const gameId = await createGame(alice);
    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
    const aliceSocket = await connect(alice);
    await aliceSocket.emitWithAck("player-joined-game", { room: gameId });
    const bobSocket = await connect(bob);
    await bobSocket.emitWithAck("watch-public-games", {});

    const changed = nextEvent(bobSocket, "public-games-changed");
    expect(await aliceSocket.emitWithAck("start-game", { room: gameId })).toEqual({ ok: true });
    await changed;
  });

  it("signale le départ d'un joueur déconnecté, après le délai de grâce", async () => {
    const gameId = await createGame(alice);
    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
    const aliceSocket = await connect(alice);
    await aliceSocket.emitWithAck("player-joined-game", { room: gameId });
    const bobSocket = await connect(bob);
    await bobSocket.emitWithAck("watch-public-games", {});

    const changed = nextEvent(bobSocket, "public-games-changed");
    aliceSocket.close();
    await changed;
  });

  it("ne signale rien aux sockets qui ne suivent pas la liste", async () => {
    const bobSocket = await connect(bob);
    const changes = countChanges(bobSocket);

    await createGame(alice);
    await settle();

    expect(changes.count).toBe(0);
  });

  it("ne signale rien pour une requête refusée", async () => {
    const bobSocket = await connect(bob);
    await bobSocket.emitWithAck("watch-public-games", {});
    const changes = countChanges(bobSocket);

    await app.inject({ method: "PATCH", url: "/api/game/join/inconnue", cookies: bob.cookies, payload: {} });
    await settle();

    expect(changes.count).toBe(0);
  });

  it("arrête le suivi en entrant dans la room d'une partie", async () => {
    const gameId = await createGame(bob);
    const bobSocket = await connect(bob);
    await bobSocket.emitWithAck("watch-public-games", {});
    await bobSocket.emitWithAck("player-joined-game", { room: gameId });
    const changes = countChanges(bobSocket);

    await createGame(alice);
    await settle();

    expect(changes.count).toBe(0);
  });
});
