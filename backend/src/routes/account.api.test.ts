import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { gamePlayers, games, sessions, users } from "../db/schema.ts";
import { purgeExpiredSessions, purgeInactiveUsers } from "../controllers/users.ts";
import { closeApp, createPlayer, setupApp, type TestPlayer } from "../../test/helpers.ts";

let app: FastifyInstance;
let alice: TestPlayer;
let bob: TestPlayer;

beforeEach(async () => {
  if (app) {
    await closeApp(app);
  }
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  bob = await createPlayer(app, "bob");
});

afterAll(async () => {
  await closeApp(app);
});

const DAY = 24 * 3600 * 1000;

async function createGame(player: TestPlayer) {
  const response = await app.inject({ method: "POST", url: "/api/game", cookies: player.cookies, payload: {} });
  return response.json<{ gameId: string }>().gameId;
}

async function join(gameId: string, player: TestPlayer) {
  await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: player.cookies, payload: {} });
}

async function userExists(id: string) {
  return (await db.select({ id: users.id }).from(users).where(eq(users.id, id))).length > 0;
}

describe("suppression de compte (droit à l'effacement)", () => {
  it("supprime le compte, ses sessions, ses parties et ses participations", async () => {
    const aliceGame = await createGame(alice);
    await join(aliceGame, bob);
    const bobGame = await createGame(bob);
    await join(bobGame, alice);

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/delete-user",
      cookies: alice.cookies,
      payload: {},
    });

    expect(response.statusCode).toBe(200);
    expect(await userExists(alice.id)).toBe(false);
    expect(await db.select().from(sessions).where(eq(sessions.userId, alice.id))).toEqual([]);
    expect(await db.select().from(games).where(eq(games.id, aliceGame))).toEqual([]);
    const bobGamePlayers = await db.select().from(gamePlayers).where(eq(gamePlayers.gameId, bobGame));
    expect(bobGamePlayers.map((player) => player.userId)).toEqual([bob.id]);
    expect(await userExists(bob.id)).toBe(true);
  });

  it("refuse la suppression sans session", async () => {
    const response = await app.inject({ method: "POST", url: "/api/auth/delete-user", payload: {} });

    expect(response.statusCode).toBe(401);
  });
});

describe("dernière activité et purge des comptes inactifs", () => {
  it("note la date de dernière activité à la connexion", async () => {
    const [user] = await db.select({ lastActiveAt: users.lastActiveAt }).from(users).where(eq(users.id, alice.id));

    expect(user.lastActiveAt).toBeInstanceOf(Date);
    expect(Date.now() - user.lastActiveAt!.getTime()).toBeLessThan(60_000);
  });

  it("supprime les comptes inactifs depuis plus de 3 ans, garde les autres", async () => {
    const now = new Date();
    await db
      .update(users)
      .set({ lastActiveAt: new Date(now.getTime() - 3 * 365 * DAY - DAY) })
      .where(eq(users.id, alice.id));
    await db
      .update(users)
      .set({ lastActiveAt: new Date(now.getTime() - 3 * 365 * DAY + DAY) })
      .where(eq(users.id, bob.id));

    const purged = await purgeInactiveUsers(now);

    expect(purged).toBe(1);
    expect(await userExists(alice.id)).toBe(false);
    expect(await userExists(bob.id)).toBe(true);
  });

  it("se base sur la date d'inscription si aucune activité n'a été notée", async () => {
    const now = new Date();
    await db
      .update(users)
      .set({ lastActiveAt: null, createdAt: new Date(now.getTime() - 4 * 365 * DAY) })
      .where(eq(users.id, alice.id));

    expect(await purgeInactiveUsers(now)).toBe(1);
    expect(await userExists(alice.id)).toBe(false);
  });
});

describe("purge des sessions expirées", () => {
  it("supprime les sessions expirées (avec leur adresse IP), garde les sessions valides", async () => {
    const now = new Date();
    await db
      .update(sessions)
      .set({ expiresAt: new Date(now.getTime() - DAY) })
      .where(eq(sessions.userId, alice.id));

    const purged = await purgeExpiredSessions(now);

    expect(purged).toBe(1);
    expect(await db.select().from(sessions).where(eq(sessions.userId, alice.id))).toEqual([]);
    expect(await db.select().from(sessions).where(eq(sessions.userId, bob.id))).toHaveLength(1);
  });
});
