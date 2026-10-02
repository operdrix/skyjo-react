import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { GameData, GameType } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
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
  sockets.forEach(socket => socket.close());
  await closeApp(app);
});

async function connect(player: TestPlayer) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  await nextEvent(socket, "connect");
  return socket;
}

function act(action: string, gameId: string, player: TestPlayer) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload: {} });
}

async function getGame(gameId: string) {
  return (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
}

// Partie d'Alice (créatrice) avec Bob, en attente ou démarrée
async function aliceAndBobGame({ start = true } = {}) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await act("join", gameId, bob);
  if (start) {
    await act("start", gameId, alice);
  }
  return gameId;
}

// Passe la partie au tour de pioche du joueur donné
async function setTurn(gameId: string, playerId: string) {
  const { gameData } = await getGame(gameId);
  const turn: GameData = { ...gameData, currentStep: "draw", currentPlayer: playerId };
  await db.update(games).set({ gameData: turn }).where(eq(games.id, gameId));
  return turn;
}

// Émet un événement et attend le refus du serveur
async function expectRefused(socket: Socket, event: string, data: object) {
  const refused = nextEvent<{ message: string }>(socket, "error");
  socket.emit(event, data);
  const { message } = await refused;
  expect(message).toBeTruthy();
}

describe("garde-fous des événements websocket", () => {
  it("refuse un coup joué hors de son tour", async () => {
    const gameId = await aliceAndBobGame();
    const turn = await setTurn(gameId, alice.id);
    const socket = await connect(bob);

    await expectRefused(socket, "play-move", { room: gameId, gameData: { ...turn, currentStep: "decide" } });

    expect((await getGame(gameId)).gameData.currentStep).toBe("draw");
  });

  it("refuse un coup d'un joueur qui n'est pas dans la partie", async () => {
    const gameId = await aliceAndBobGame();
    const turn = await setTurn(gameId, carol.id);
    const socket = await connect(carol);

    await expectRefused(socket, "play-move", { room: gameId, gameData: { ...turn, currentStep: "decide" } });

    expect((await getGame(gameId)).gameData.currentStep).toBe("draw");
  });

  it("refuse la révélation initiale d'une carte d'un autre joueur", async () => {
    const gameId = await aliceAndBobGame();
    const aliceCard = (await getGame(gameId)).gameData.playersCards[alice.id][0];
    const socket = await connect(bob);

    await expectRefused(socket, "initial-turn-card", { room: gameId, playerId: alice.id, cardId: aliceCard.id });

    expect((await getGame(gameId)).gameData.playersCards[alice.id][0].revealed).toBe(false);
  });

  it("refuse le démarrage par un autre joueur que le créateur", async () => {
    const gameId = await aliceAndBobGame({ start: false });
    const socket = await connect(bob);

    await expectRefused(socket, "start-game", { room: gameId });

    expect((await getGame(gameId)).state).toBe("pending");
  });

  it("refuse la diffusion des paramètres par un autre joueur que le créateur", async () => {
    const gameId = await aliceAndBobGame({ start: false });
    const socket = await connect(bob);

    await expectRefused(socket, "update-game-params", { room: gameId });
  });

  it("refuse la relance par un autre joueur que le créateur", async () => {
    const gameId = await aliceAndBobGame();
    const socket = await connect(bob);

    await expectRefused(socket, "restart-game", { room: gameId });
  });

  it("refuse la demande de rejouer d'un joueur qui n'est pas dans la partie", async () => {
    const gameId = await aliceAndBobGame();
    const socket = await connect(carol);

    await expectRefused(socket, "player-play-again", { room: gameId });

    expect((await getGame(gameId)).playersPlayAgain).toEqual([]);
  });

  it("n'ajoute que l'émetteur à la liste des joueurs qui veulent rejouer", async () => {
    const gameId = await aliceAndBobGame();
    const socket = await connect(bob);

    const joined = nextEvent(socket, "player-joined-game");
    socket.emit("player-joined-game", { room: gameId });
    await joined;

    const playAgain = nextEvent<GameType>(socket, "play-again");
    socket.emit("player-play-again", { room: gameId, playersPlayAgain: [alice.id, bob.id] });

    expect((await playAgain).playersPlayAgain).toEqual([bob.id]);
  });
});
