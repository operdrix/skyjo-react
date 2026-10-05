import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { GameType } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { linkGuestAccount } from "../controllers/users.ts";
import {
  closeApp,
  connectPlayer,
  createGuest,
  createPlayer,
  nextEvent,
  sessionCookies,
  setupApp,
  storedGameData,
  type TestPlayer,
} from "../../test/helpers.ts";

let app: FastifyInstance;
let url: string;
let alice: TestPlayer;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  url = await app.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
  await closeApp(app);
});

// Partie démarrée d'Alice avec l'invité, qui a révélé sa première carte
async function gameWithGuest(guest: TestPlayer) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: guest.cookies, payload: {} });
  await app.inject({ method: "PATCH", url: `/api/game/start/${gameId}`, cookies: alice.cookies, payload: {} });
  const socket = connectPlayer(url, guest);
  await nextEvent(socket, "connect");
  await socket.emitWithAck("player-joined-game", { room: gameId });
  await socket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 0 });
  socket.close();
  return gameId;
}

// Inscription par email depuis la session de l'invité
async function signUpAsGuest(guest: TestPlayer, name: string, username: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    cookies: guest.cookies,
    payload: { email: `${name}@test.local`, password: "mot-de-passe-de-test", name: username, username },
  });
  return { response, player: { id: response.json()?.user?.id, cookies: sessionCookies(response) } as TestPlayer };
}

const userById = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0];

describe("un invité crée son compte", () => {
  it("garde son pseudo et retrouve ses parties dans son historique", async () => {
    const { guest } = await createGuest(app, "Lynx 42");
    const gameId = await gameWithGuest(guest);

    const { response, player } = await signUpAsGuest(guest, "lynx", "Lynx 42");

    expect(response.statusCode).toBe(200);
    expect((await userById(player.id)).username).toBe("Lynx 42");
    expect(await userById(guest.id)).toBeUndefined();
    const history = await app.inject({ method: "GET", url: `/api/users/${player.id}/games` });
    expect(history.json<GameType[]>().map((game) => game.id)).toContain(gameId);
  });

  it("continue la partie en cours avec son nouveau compte", async () => {
    const { guest } = await createGuest(app, "Renard 7");
    const gameId = await gameWithGuest(guest);

    const { player } = await signUpAsGuest(guest, "renard", "Renard 7");

    const gameData = await storedGameData(gameId);
    expect(gameData.playersCards[guest.id]).toBeUndefined();
    expect(gameData.playersCards[player.id][0].revealed).toBe(true);
    expect(gameData.turnOrder).toContain(player.id);
    const socket = connectPlayer(url, player);
    await nextEvent(socket, "connect");
    expect(await socket.emitWithAck("player-joined-game", { room: gameId })).toEqual({ ok: true });
    expect(await socket.emitWithAck("play-move", { room: gameId, move: "reveal", cardIndex: 1 })).toEqual({ ok: true });
    socket.close();
  });

  it("garde son pseudo d'invité si l'inscription échoue", async () => {
    const { guest } = await createGuest(app, "Hibou 3");

    const { response } = await signUpAsGuest(guest, "alice", "Hibou 3");

    expect(response.statusCode).not.toBe(200);
    expect((await userById(guest.id)).username).toBe("Hibou 3");
  });

  it("reprend le pseudo de l'invité pour un compte créé par Google (sans pseudo)", async () => {
    const { guest } = await createGuest(app, "Loutre 9");
    const gameId = await gameWithGuest(guest);
    const google = await createPlayer(app, "google-sans-pseudo");
    await db.update(users).set({ username: null }).where(eq(users.id, google.id));

    await linkGuestAccount(guest.id, google.id);

    expect((await userById(google.id)).username).toBe("Loutre 9");
    expect((await storedGameData(gameId)).playersCards[google.id]).toHaveLength(12);
  });
});
