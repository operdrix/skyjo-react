import type { FastifyInstance } from "fastify";
import type { Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Ack, GameType, NextGame } from "../../../shared/types.ts";
import { purgeInactiveUsers } from "../controllers/users.ts";
import { db } from "../db/index.ts";
import { games, users } from "../db/schema.ts";
import { chooseIntent } from "../game/bots.ts";
import { hideCards } from "../game/view.ts";
import {
  closeApp,
  connectPlayer,
  createGuest,
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

async function createGame(player: TestPlayer) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: player.cookies, payload: {} });
  return created.json<{ gameId: string }>().gameId;
}

// Socket connecté et entré dans la room de la partie
async function joinRoom(player: TestPlayer, room: string) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  const ack = (await socket.emitWithAck("player-joined-game", { room })) as Ack;
  expect(ack).toEqual({ ok: true });
  return socket;
}

const getGame = async (gameId: string) =>
  (await app.inject({ method: "GET", url: `/api/game/${gameId}`, cookies: alice.cookies })).json<GameType>();

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("ajouter et retirer un robot", () => {
  it("le créateur ajoute des robots Facile, chacun avec son nom et la mention robot", async () => {
    const gameId = await createGame(alice);
    const socket = await joinRoom(alice, gameId);

    const joined = nextEvent<GameType>(socket, "player-joined-game");
    expect(await socket.emitWithAck("add-bot", { room: gameId, level: "facile" })).toEqual({ ok: true });
    const game = await joined;
    const bot = game.players.find((player) => player.isBot)!;
    expect(bot).toMatchObject({ username: "Robot facile", isBot: true, botLevel: "facile", isAnonymous: false });

    expect(await socket.emitWithAck("add-bot", { room: gameId, level: "facile" })).toEqual({ ok: true });
    const bots = (await getGame(gameId)).players.filter((player) => player.isBot);
    expect(bots.map((player) => player.username)).toEqual(["Robot facile", "Robot facile 2"]);
    expect(new Set(bots.map((player) => player.id)).size).toBe(2);
    const alicePlayer = (await getGame(gameId)).players.find((player) => player.id === alice.id)!;
    expect(alicePlayer).toMatchObject({ isBot: false, botLevel: null });
  });

  it("le créateur retire un robot", async () => {
    const gameId = await createGame(alice);
    const socket = await joinRoom(alice, gameId);
    await socket.emitWithAck("add-bot", { room: gameId, level: "facile" });
    const botId = (await getGame(gameId)).players.find((player) => player.isBot)!.id;

    const left = nextEvent<GameType>(socket, "player-left-game");
    expect(await socket.emitWithAck("remove-bot", { room: gameId, botId })).toEqual({ ok: true });
    expect((await left).players.map((player) => player.id)).toEqual([alice.id]);
  });

  it("refuse l'ajout et le retrait à un joueur qui n'est pas le créateur", async () => {
    const gameId = await createGame(alice);
    const aliceSocket = await joinRoom(alice, gameId);
    await aliceSocket.emitWithAck("add-bot", { room: gameId, level: "facile" });
    const botId = (await getGame(gameId)).players.find((player) => player.isBot)!.id;
    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
    const bobSocket = await joinRoom(bob, gameId);

    expect(await bobSocket.emitWithAck("add-bot", { room: gameId, level: "facile" })).toMatchObject({ ok: false });
    expect(await bobSocket.emitWithAck("remove-bot", { room: gameId, botId })).toMatchObject({ ok: false });
    expect((await getGame(gameId)).players).toHaveLength(3);
  });

  it("refuse un robot quand la partie est complète", async () => {
    const gameId = await createGame(alice);
    await app.inject({
      method: "PATCH",
      url: `/api/game/${gameId}`,
      cookies: alice.cookies,
      payload: { maxPlayers: 2 },
    });
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("add-bot", { room: gameId, level: "facile" })).toEqual({ ok: true });
    expect(await socket.emitWithAck("add-bot", { room: gameId, level: "facile" })).toMatchObject({ ok: false });
    expect((await getGame(gameId)).players).toHaveLength(2);
  });

  it("refuse l'ajout et le retrait une fois la partie lancée", async () => {
    const gameId = await createGame(alice);
    const socket = await joinRoom(alice, gameId);
    await socket.emitWithAck("add-bot", { room: gameId, level: "facile" });
    const botId = (await getGame(gameId)).players.find((player) => player.isBot)!.id;
    expect(await socket.emitWithAck("start-game", { room: gameId })).toEqual({ ok: true });

    expect(await socket.emitWithAck("add-bot", { room: gameId, level: "facile" })).toMatchObject({ ok: false });
    expect(await socket.emitWithAck("remove-bot", { room: gameId, botId })).toMatchObject({ ok: false });
  });

  it("refuse de retirer un joueur humain ou un niveau inconnu", async () => {
    const gameId = await createGame(alice);
    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: bob.cookies, payload: {} });
    const socket = await joinRoom(alice, gameId);

    expect(await socket.emitWithAck("remove-bot", { room: gameId, botId: bob.id })).toMatchObject({ ok: false });
    expect(await socket.emitWithAck("add-bot", { room: gameId, level: "expert" })).toMatchObject({ ok: false });
    expect((await getGame(gameId)).players.map((player) => player.id)).toEqual([alice.id, bob.id]);
  });
});

describe("partie contre un robot", () => {
  // Alice joue ses coups (choisis comme un robot Facile) et lance les manches ; le robot joue seul les siens
  async function playUntilFinished(gameId: string, socket: Socket) {
    for (let step = 0; step < 5000; step++) {
      const [game] = await db.select({ state: games.state }).from(games).where(eq(games.id, gameId));
      if (game.state === "finished") return;
      const gameData = await storedGameData(gameId);
      if (gameData.currentStep === "endGame") {
        await socket.emitWithAck("start-game", { room: gameId });
        continue;
      }
      const intent = chooseIntent(hideCards(gameData), alice.id, "facile");
      if (intent) {
        await socket.emitWithAck("play-move", { room: gameId, ...intent });
      } else {
        await pause(5);
      }
    }
    throw new Error("Partie sans fin");
  }

  it("se joue jusqu'au bout, le robot jouant tous ses coups, puis le robot veut rejouer", async () => {
    const gameId = await createGame(alice);
    const socket = await joinRoom(alice, gameId);
    await socket.emitWithAck("add-bot", { room: gameId, level: "facile" });
    const botId = (await getGame(gameId)).players.find((player) => player.isBot)!.id;
    expect(await socket.emitWithAck("start-game", { room: gameId })).toEqual({ ok: true });

    await playUntilFinished(gameId, socket);

    const finished = await getGame(gameId);
    expect(finished.state).toBe("finished");
    expect(Math.max(...finished.players.map((player) => player.game_players.score))).toBeGreaterThanOrEqual(100);
    expect(finished.playersPlayAgain).toEqual([botId]);

    // Alice veut rejouer : la nouvelle partie contient le robot, qui révèle ses cartes de lui-même
    await socket.emitWithAck("player-play-again", { room: gameId });
    const next = nextEvent<NextGame>(socket, "go-to-new-game");
    expect(await socket.emitWithAck("restart-game", { room: gameId })).toEqual({ ok: true });
    const { gameId: nextId } = await next;
    for (let i = 0; i < 100; i++) {
      const cards = (await storedGameData(nextId)).playersCards[botId];
      if (cards.filter((card) => card.revealed).length === 2) break;
      await pause(10);
    }
    expect((await storedGameData(nextId)).playersCards[botId].filter((card) => card.revealed)).toHaveLength(2);
  }, 120_000);

  it("un invité joue dans une partie avec un robot", async () => {
    const { guest } = await createGuest(app, "invite");
    const gameId = await createGame(alice);
    const aliceSocket = await joinRoom(alice, gameId);
    await aliceSocket.emitWithAck("add-bot", { room: gameId, level: "facile" });
    await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: guest.cookies, payload: {} });
    const guestSocket = await joinRoom(guest, gameId);
    expect(await aliceSocket.emitWithAck("start-game", { room: gameId })).toEqual({ ok: true });

    const gameData = await storedGameData(gameId);
    const hiddenIndex = gameData.playersCards[guest.id].findIndex((card) => !card.revealed);
    expect(
      await guestSocket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: hiddenIndex }),
    ).toEqual({
      ok: true,
    });
  });
});

describe("comptes des robots", () => {
  it("ne peuvent pas se connecter et échappent à la purge des comptes inactifs", async () => {
    const gameId = await createGame(alice);
    const socket = await joinRoom(alice, gameId);
    await socket.emitWithAck("add-bot", { room: gameId, level: "facile" });
    const [bot] = await db.select().from(users).where(eq(users.isBot, true)).limit(1);

    const signIn = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      payload: { email: bot.email, password: "nimportequoi-123" },
    });
    expect(signIn.statusCode).not.toBe(200);

    await purgeInactiveUsers(new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000));
    expect(await db.select({ id: users.id }).from(users).where(eq(users.id, bot.id))).toHaveLength(1);
  });
});
