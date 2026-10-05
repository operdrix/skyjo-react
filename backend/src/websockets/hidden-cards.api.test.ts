import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { GameType, ServerEvent } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
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

function act(action: string, gameId: string, player: TestPlayer) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload: {} });
}

async function getGame(gameId: string) {
  return (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
}

// Partie d'Alice avec Bob, en attente
async function pendingGame() {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await act("join", gameId, bob);
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

// Cartes des joueurs et de la pioche qui laissent voir une valeur ou une couleur sans être révélées
function leakedCards(game: GameType) {
  const cards = [...Object.values(game.gameData.playersCards).flat(), ...game.gameData.deckCards];
  return cards.filter((card) => !card.revealed && ("value" in card || "color" in card));
}

// Partie diffusée à un socket lors de l'événement
const broadcast = (socket: Socket, event: ServerEvent) => nextEvent<GameType>(socket, event);

describe("cartes cachées", () => {
  it("ne renvoie aucune carte cachée à la lecture d'une partie, au démarrage comme à la lecture", async () => {
    const gameId = await pendingGame();

    const started = (await act("start", gameId, alice)).json<GameType>();
    const read = await getGame(gameId);

    expect(leakedCards(started)).toEqual([]);
    expect(leakedCards(read)).toEqual([]);
    expect(read.gameData.deckCards).toHaveLength(150 - 24 - 1);
  });

  it("ne renvoie aucune carte cachée dans la liste des parties", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);

    const list = (await app.inject({ method: "GET", url: "/api/games?state=playing" })).json<GameType[]>();

    expect(list.length).toBeGreaterThan(0);
    expect(list.flatMap(leakedCards)).toEqual([]);
  });

  it("ne diffuse aucune carte cachée, à aucun joueur", async () => {
    const gameId = await pendingGame();
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);

    const started = [broadcast(aliceSocket, "start-game"), broadcast(bobSocket, "start-game")];
    await aliceSocket.emitWithAck("start-game", { room: gameId });
    const moved = [broadcast(aliceSocket, "play-move"), broadcast(bobSocket, "play-move")];
    await aliceSocket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 0 });
    const joined = [broadcast(aliceSocket, "player-joined-game"), broadcast(bobSocket, "player-joined-game")];
    await bobSocket.emitWithAck("player-joined-game", { room: gameId });

    const received = await Promise.all([...started, ...moved, ...joined]);
    expect(received.flatMap(leakedCards)).toEqual([]);
    expect(received[0].gameData.deckCards).toHaveLength(150 - 24 - 1);
  });

  it("montre à tous la carte piochée", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);
    const [stored] = await db.select().from(games).where(eq(games.id, gameId));
    await db
      .update(games)
      .set({ gameData: { ...stored.gameData, currentStep: "draw", currentPlayer: alice.id } })
      .where(eq(games.id, gameId));
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);

    const moved = broadcast(bobSocket, "play-move");
    await aliceSocket.emitWithAck("play-move", { room: gameId, move: "draw" });

    const [drawn] = (await moved).gameData.deckCards;
    expect(drawn).toMatchObject({ value: stored.gameData.deckCards[0].value, revealed: true, onHand: true });
  });

  it("montre toutes les cartes des joueurs en fin de manche", async () => {
    const gameId = await pendingGame();
    await act("start", gameId, alice);
    const [stored] = await db.select().from(games).where(eq(games.id, gameId));
    await db
      .update(games)
      .set({ gameData: { ...stored.gameData, currentStep: "endGame" } })
      .where(eq(games.id, gameId));

    const read = await getGame(gameId);

    const cards = Object.values(read.gameData.playersCards).flat();
    expect(cards).toHaveLength(24);
    expect(cards.every((card) => typeof card.value === "number")).toBe(true);
  });
});
