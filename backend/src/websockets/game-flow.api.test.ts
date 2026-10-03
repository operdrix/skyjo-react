import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Card, GameType } from "../../../shared/types.ts";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
import {
  closeApp,
  connectPlayer,
  type TestPlayer,
  createPlayer,
  nextEvent as nextSocketEvent,
  setupApp,
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

// Socket connecté et entré dans la room de la partie
async function joinRoom(player: TestPlayer, room: string) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  const joined = nextEvent(socket, "player-joined-game");
  socket.emit("player-joined-game", { room, userId: player.id });
  await joined;
  return socket;
}

const nextEvent = <T = GameType>(socket: Socket, event: string) => nextSocketEvent<T>(socket, event);

function act(action: string, gameId: string, player: TestPlayer, payload: object = { userId: player.id }) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload });
}

// Partie démarrée à 2 joueurs, Alice dans la room
async function startedGame() {
  const created = await app.inject({
    method: "POST",
    url: "/api/game",
    cookies: alice.cookies,
    payload: { userId: alice.id },
  });
  const gameId = created.json<{ gameId: string }>().gameId;
  await act("join", gameId, bob);
  const game = (await act("start", gameId, alice, {})).json<GameType>();
  const socket = await joinRoom(alice, gameId);
  return { gameId, game, socket };
}

// Toutes les cartes révélées, colonnes jamais identiques
function revealedHand(prefix: string, top: number, middle: number): Card[] {
  const values = [top, top, top, top, middle, middle, middle, middle, top, top, top, top];
  return values.map((value, index) => ({
    id: `${prefix}${index}`,
    value,
    color: "green" as const,
    revealed: true,
    onHand: false,
  }));
}

// Passe la partie au tour d'Alice
async function aliceTurn(gameId: string, game: GameType) {
  await db
    .update(games)
    .set({ gameData: { ...game.gameData, currentStep: "draw", currentPlayer: alice.id } })
    .where(eq(games.id, gameId));
}

// Fin du tour d'Alice alors que toutes les cartes sont révélées : fin de manche
function lastMove(game: GameType, aliceHand: Card[], bobHand: Card[]) {
  return {
    ...game.gameData,
    currentStep: "endTurn",
    currentPlayer: alice.id,
    turnOrder: [alice.id, bob.id],
    lastTurn: false,
    firstPlayerToEnd: null,
    playersCards: { [alice.id]: aliceHand, [bob.id]: bobHand },
  };
}

const playerOf = (game: GameType, player: TestPlayer) => game.players.find((candidate) => candidate.id === player.id)!;

describe("déroulé d'une partie par websocket", () => {
  it("révèle une carte initiale et diffuse la partie", async () => {
    const { gameId, game, socket } = await startedGame();
    const cardId = game.gameData.playersCards[alice.id][0].id;

    const moved = nextEvent(socket, "play-move");
    socket.emit("initial-turn-card", { room: gameId, playerId: alice.id, cardId });
    const updated = await moved;

    expect(updated.gameData.playersCards[alice.id][0].revealed).toBe(true);
    const stored = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
    expect(stored.gameData.playersCards[alice.id][0].revealed).toBe(true);
  });

  it("révèle deux cartes initiales envoyées en même temps", async () => {
    const { gameId, game, socket } = await startedGame();
    const [first, second] = game.gameData.playersCards[alice.id];

    let moves = 0;
    const bothMoved = new Promise<void>((resolve) => socket.on("play-move", () => ++moves === 2 && resolve()));
    socket.emit("initial-turn-card", { room: gameId, playerId: alice.id, cardId: first.id });
    socket.emit("initial-turn-card", { room: gameId, playerId: alice.id, cardId: second.id });
    await bothMoved;

    const stored = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
    const revealed = stored.gameData.playersCards[alice.id].filter((card) => card.revealed).map((card) => card.id);
    expect(revealed.sort()).toEqual([first.id, second.id].sort());
  });

  it("enregistre les scores de fin de manche sans terminer la partie", async () => {
    const { gameId, game, socket } = await startedGame();
    await aliceTurn(gameId, game);

    const moved = nextEvent(socket, "play-move");
    socket.emit("play-move", {
      room: gameId,
      gameData: lastMove(game, revealedHand("a", 0, 1), revealedHand("b", 5, 6)),
    });
    const updated = await moved;

    expect(updated.gameData.currentStep).toBe("endGame");
    expect(updated.state).toBe("playing");
    expect(playerOf(updated, alice).game_players).toMatchObject({ score: 4, scoreByRound: [4] });
    expect(playerOf(updated, bob).game_players).toMatchObject({ score: 64, scoreByRound: [64] });
    const stored = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
    expect(playerOf(stored, bob).game_players.score).toBe(64);
  });

  it("termine la partie quand un joueur atteint 100 points", async () => {
    const { gameId, game, socket } = await startedGame();
    await aliceTurn(gameId, game);

    const moved = nextEvent(socket, "play-move");
    socket.emit("play-move", {
      room: gameId,
      gameData: lastMove(game, revealedHand("a", 0, 1), revealedHand("b", 12, 11)),
    });
    const updated = await moved;

    expect(updated).toMatchObject({ state: "finished", winner: alice.id, winnerScore: 4 });
  });

  it("relance une nouvelle partie avec les joueurs qui veulent rejouer", async () => {
    const { gameId, socket } = await startedGame();

    const bobSocket = await joinRoom(bob, gameId);
    const aliceAgain = nextEvent(socket, "play-again");
    socket.emit("player-play-again", { room: gameId });
    await aliceAgain;
    const bobAgain = nextEvent(socket, "play-again");
    bobSocket.emit("player-play-again", { room: gameId });
    expect((await bobAgain).playersPlayAgain).toEqual([alice.id, bob.id]);

    const newGameEvent = nextEvent<{ gameId: string; players: string[] }>(socket, "go-to-new-game");
    socket.emit("restart-game", { room: gameId });
    const { gameId: newGameId, players } = await newGameEvent;

    expect(players).toEqual([alice.id, bob.id]);
    const newGame = (await app.inject({ method: "GET", url: `/api/game/${newGameId}` })).json<GameType>();
    expect(newGame).toMatchObject({ state: "playing", private: true, creator: alice.id, roundNumber: 1 });
    expect(newGame.players.map((player) => player.id).sort()).toEqual([alice.id, bob.id].sort());
  });
});
