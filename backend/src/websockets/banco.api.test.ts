import type { Socket } from "socket.io-client";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { BancoCard, BancoData, GameType, PublicBancoData } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { gamePlayers, games } from "../db/schema.ts";
import { deal } from "../game/banco/rules.ts";
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

type BancoGame = GameType<PublicBancoData>;

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;
let bob: TestPlayer;
let carol: TestPlayer;
const sockets: Socket[] = [];

// Délai de grâce des tests (PRESENCE_GRACE_MS dans vitest.config.ts), avec une marge
const AFTER_GRACE_MS = Number(process.env.PRESENCE_GRACE_MS) + 300;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function act(action: string, gameId: string, player: TestPlayer) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload: {} });
}

async function joinRoom(player: TestPlayer, room: string) {
  const socket = connectPlayer(url, player);
  sockets.push(socket);
  const joined = nextEvent(socket, "player-joined-game");
  socket.emit("player-joined-game", { room });
  await joined;
  return socket;
}

const storedBanco = (gameId: string) => storedGameData<BancoData>(gameId);

let cardId = 0;
const card = (value: number | BancoCard["kind"]): BancoCard =>
  typeof value === "number"
    ? { id: `seed-${++cardId}`, kind: "number", value }
    : ({ id: `seed-${++cardId}`, kind: value } as BancoCard);

// Redistribue la manche en cours avec une pioche connue (la première carte sort d'abord)
async function seedBanco(gameId: string, deckValues: (number | BancoCard["kind"])[], discardValues: number[] = []) {
  const { turnOrder } = await storedBanco(gameId);
  const previous = {
    deck: deckValues.map(card),
    discard: discardValues.map(card),
    hands: {},
    pending: [],
  } as unknown as BancoData;
  await db
    .update(games)
    .set({ gameData: deal(turnOrder, 1, previous) })
    .where(eq(games.id, gameId));
}

// Pioche sans action : chaque coup donne un nombre
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Partie de Banco créée par Alice, rejointe par les autres joueurs, démarrée
async function startedBanco(others: TestPlayer[] = [bob]) {
  const created = await app.inject({
    method: "POST",
    url: "/api/game",
    cookies: alice.cookies,
    payload: { type: "banco" },
  });
  const gameId = created.json<{ gameId: string }>().gameId;
  for (const player of others) await act("join", gameId, player);
  const started = await act("start", gameId, alice);
  return { gameId, game: started.json<BancoGame>() };
}

// Partie démarrée avec une pioche sans action, pour des tours prévisibles
async function seededBanco(others: TestPlayer[] = [bob]) {
  const started = await startedBanco(others);
  await seedBanco(started.gameId, NUMBERS);
  return started;
}

const play = (socket: Socket, room: string, move: "hit" | "stay") => socket.emitWithAck("play-move", { room, move });
const target = (socket: Socket, room: string, player: TestPlayer) =>
  socket.emitWithAck("play-move", { room, move: "target", target: player.id });

describe("partie de Banco", () => {
  it("se lance avec le paquet complet, Alice commence, pioche et défausse ne sont pas diffusées", async () => {
    const { gameId, game } = await startedBanco([bob, carol]);

    expect(game.gameType).toBe("banco");
    expect(game.gameData.turnOrder[0]).toBe(alice.id);
    expect(game.gameData).not.toHaveProperty("deck");
    expect(game.gameData).not.toHaveProperty("discard");
    const { hands, pending, deckCount, discardCount } = game.gameData;
    expect(Object.values(hands).flat().length + pending.length + deckCount + discardCount).toBe(94);

    const stored = await storedBanco(gameId);
    const fetched = await app.inject({ method: "GET", url: `/api/game/${gameId}` });
    for (const card of stored.deck) expect(fetched.body).not.toContain(card.id);
  });

  it("refuse le lancement à un seul joueur", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/game",
      cookies: alice.cookies,
      payload: { type: "banco" },
    });
    const gameId = created.json<{ gameId: string }>().gameId;

    expect((await act("start", gameId, alice)).statusCode).toBe(400);
  });

  it("joue une manche par intentions, refuse un coup hors de son tour, enregistre les scores", async () => {
    const { gameId } = await seededBanco();
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);

    expect(await play(bobSocket, gameId, "hit")).toEqual({ ok: false, message: "Coup refusé" });

    const afterHit = nextEvent<BancoGame>(bobSocket, "play-move");
    expect(await play(aliceSocket, gameId, "hit")).toEqual({ ok: true });
    const hit = await afterHit;
    expect(hit.gameData.lastDraw?.playerId).toBe(alice.id);
    const stored = await storedBanco(gameId);
    for (const card of stored.deck) expect(JSON.stringify(hit)).not.toContain(card.id);

    // Tours suivants jusqu'à ce que tout le monde se soit arrêté ou soit éliminé
    let state = await storedBanco(gameId);
    while (!state.roundOver) {
      const socket = state.currentPlayer === alice.id ? aliceSocket : bobSocket;
      expect(await play(socket, gameId, "stay")).toEqual({ ok: true });
      state = await storedBanco(gameId);
    }

    const rows = await db.select().from(gamePlayers).where(eq(gamePlayers.gameId, gameId));
    expect(rows.map((row) => row.scoreByRound.length)).toEqual([1, 1]);
  });

  it("fait commencer le joueur suivant à la manche suivante", async () => {
    const { gameId } = await seededBanco();
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);
    await play(aliceSocket, gameId, "stay");
    await play(bobSocket, gameId, "stay");

    const next = await act("start", gameId, alice);

    const { gameData } = next.json<BancoGame>();
    expect(gameData.currentPlayer).toBe(bob.id);
    // La pioche continue : les 2 cartes de la manche précédente sont défaussées, 2 nouvelles sont distribuées
    expect(gameData.discardCount).toBe(2);
    expect(gameData.deckCount).toBe(NUMBERS.length - 4);
  });

  it("termine la partie quand un joueur atteint 200, le plus haut total gagne", async () => {
    const { gameId } = await seededBanco();
    await db
      .update(gamePlayers)
      .set({ score: 300 })
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, alice.id)));
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);

    await play(aliceSocket, gameId, "stay");
    const ended = nextEvent<BancoGame>(aliceSocket, "play-move");
    await play(bobSocket, gameId, "stay");

    const game = await ended;
    expect(game.state).toBe("finished");
    expect(game.winner).toBe(alice.id);
  });

  it("laisse un invité rejoindre et jouer", async () => {
    const { guest } = await createGuest(app, "invité-banco");
    const { gameId } = await seededBanco([guest]);
    const aliceSocket = await joinRoom(alice, gameId);
    const guestSocket = await joinRoom(guest, gameId);

    await play(aliceSocket, gameId, "stay");

    expect(await play(guestSocket, gameId, "hit")).toEqual({ ok: true });
  });

  it("passe le tour d'un joueur parti après le délai de grâce", async () => {
    const { gameId } = await seededBanco();
    const aliceSocket = await joinRoom(alice, gameId);
    await joinRoom(bob, gameId);

    aliceSocket.close();
    await wait(AFTER_GRACE_MS);

    const state = await storedBanco(gameId);
    expect(state.status[alice.id]).toBe("stopped");
    expect(state.currentPlayer).toBe(bob.id);
  });

  it("refuse une cible qui n'est plus en jeu, puis applique l'action à une cible valide", async () => {
    const { gameId } = await startedBanco([bob, carol]);
    await seedBanco(gameId, [1, 2, 3, 4, "freeze", 5, 6]);
    const aliceSocket = await joinRoom(alice, gameId);
    const bobSocket = await joinRoom(bob, gameId);
    const carolSocket = await joinRoom(carol, gameId);
    await play(aliceSocket, gameId, "hit");
    await play(bobSocket, gameId, "stay");
    await play(carolSocket, gameId, "hit");

    expect(await target(carolSocket, gameId, bob)).toEqual({ ok: false, message: "Coup refusé" });
    expect(await target(aliceSocket, gameId, alice)).toEqual({ ok: false, message: "Coup refusé" });

    const applied = nextEvent<BancoGame>(aliceSocket, "play-move");
    expect(await target(carolSocket, gameId, alice)).toEqual({ ok: true });
    const game = await applied;
    expect(game.gameData.status[alice.id]).toBe("stopped");
    expect(game.gameData.lastAction).toMatchObject({ playerId: carol.id, target: alice.id });
  });

  it("ne diffuse aucune carte de la pioche reformée avec la défausse", async () => {
    const { gameId } = await startedBanco();
    await seedBanco(gameId, [1, 2], [3, 4, 5, 6, 7, 8, 9, 10]);
    const aliceSocket = await joinRoom(alice, gameId);
    await joinRoom(bob, gameId);

    const afterHit = nextEvent<BancoGame>(aliceSocket, "play-move");
    expect(await play(aliceSocket, gameId, "hit")).toEqual({ ok: true });
    const hit = await afterHit;

    const stored = await storedBanco(gameId);
    expect(stored.deck).toHaveLength(7);
    expect(hit.gameData.deckCount).toBe(7);
    const fetched = await app.inject({ method: "GET", url: `/api/game/${gameId}` });
    for (const card of stored.deck) {
      expect(JSON.stringify(hit)).not.toContain(card.id);
      expect(fetched.body).not.toContain(card.id);
    }
  });
});
