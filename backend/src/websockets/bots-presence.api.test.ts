import type { FastifyInstance } from "fastify";
import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { GameData, GameType } from "../../../shared/types.ts";
import { playBotMove } from "../controllers/games.ts";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
import {
  closeApp,
  connectPlayer,
  createPlayer,
  nextEvent,
  setupApp,
  storedGameData,
  type TestPlayer,
} from "../../test/helpers.ts";

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

async function joinRoom(player: TestPlayer, room: string) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  await nextEvent(socket, "connect");
  expect(await socket.emitWithAck("player-joined-game", { room })).toEqual({ ok: true });
  return socket;
}

const getGame = async (gameId: string) =>
  (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();

// Partie lancée avec un robot (et Bob si demandé) ; une fois les robots révélés, c'est au tour du robot
async function gameAtBotTurn(withBob = false) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  if (withBob) {
    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
  }
  const aliceSocket = await joinRoom(alice, gameId);
  const bobSocket = withBob ? await joinRoom(bob, gameId) : null;
  await aliceSocket.emitWithAck("add-bot", { room: gameId, level: "facile" });
  const botId = (await getGame(gameId)).players.find((player) => player.isBot)!.id;
  await aliceSocket.emitWithAck("start-game", { room: gameId });
  for (
    let i = 0;
    i < 100 && (await storedGameData(gameId)).playersCards[botId].filter((c) => c.revealed).length < 2;
    i++
  ) {
    await wait(10);
  }

  const gameData: GameData = await storedGameData(gameId);
  for (const cards of Object.values(gameData.playersCards)) {
    cards.forEach((card, index) => (card.revealed = card.revealed || index < 2));
  }
  Object.assign(gameData, { currentStep: "draw", currentPlayer: botId });
  await db.update(games).set({ gameData }).where(eq(games.id, gameId));
  return { gameId, botId, aliceSocket, bobSocket };
}

describe("robots et présence des humains", () => {
  it("le robot ne joue plus quand le seul humain est parti, et reprend à son retour", async () => {
    const { gameId, aliceSocket } = await gameAtBotTurn();

    aliceSocket.close();
    await wait(AFTER_GRACE_MS);

    expect(await playBotMove(gameId)).toBeNull();
    expect((await storedGameData(gameId)).currentStep).toBe("draw");

    // Retour d'Alice : le robot joue son tour
    const socket = connectPlayer(url, alice);
    sockets.push(socket);
    await nextEvent(socket, "connect");
    const botMove = nextEvent<GameType>(socket, "play-move");
    expect(await socket.emitWithAck("player-joined-game", { room: gameId })).toEqual({ ok: true });
    expect((await botMove).gameData.currentStep).not.toBe("draw");
  });

  it("le robot continue tant qu'un des humains est connecté", async () => {
    const { gameId, bobSocket } = await gameAtBotTurn(true);

    bobSocket!.close();
    await wait(AFTER_GRACE_MS);

    expect(await playBotMove(gameId)).not.toBeNull();
  });

  it("un geste programmé sur une partie supprimée ne casse rien", async () => {
    const { gameId } = await gameAtBotTurn();
    await app.inject({ method: "DELETE", url: `/api/game/${gameId}`, cookies: alice.cookies });

    expect(await playBotMove(gameId)).toBeNull();
  });
});
