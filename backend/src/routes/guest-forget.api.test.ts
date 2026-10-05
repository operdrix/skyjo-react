import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { GameType } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { sessions, users } from "../db/schema.ts";
import { forgetInactiveGuests, purgeInactiveUsers } from "../controllers/users.ts";
import { closeApp, createGuest, createPlayer, setupApp, type TestPlayer } from "../../test/helpers.ts";

let app: FastifyInstance;
let alice: TestPlayer;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
});

afterAll(async () => {
  await closeApp(app);
});

const DAY = 24 * 3600 * 1000;

// Dernière visite il y a `days` jours : la session (7 jours glissants) expire 7 jours après
async function lastVisit(player: TestPlayer, days: number) {
  const expiresAt = new Date(Date.now() - days * DAY + 7 * DAY);
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.userId, player.id));
}

const userById = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0];
const sessionsOf = async (id: string) => db.select().from(sessions).where(eq(sessions.userId, id));

// Partie d'Alice où l'invité a joué
async function gameWith(guest: TestPlayer) {
  const created = await app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload: {} });
  const gameId = created.json<{ gameId: string }>().gameId;
  await app.inject({ method: "PATCH", url: `/api/game/join/${gameId}`, cookies: guest.cookies, payload: {} });
  return gameId;
}

describe("oubli des invités après 7 jours sans visite", () => {
  it("oublie un invité absent depuis plus de 7 jours, garde les invités actifs et les comptes", async () => {
    const { guest: absent } = await createGuest(app, "Lynx 42");
    const { guest: active } = await createGuest(app, "Renard 7");
    const bob = await createPlayer(app, "bob");
    await gameWith(absent);
    await lastVisit(absent, 8);
    await lastVisit(active, 2);
    await lastVisit(bob, 8);

    const forgotten = await forgetInactiveGuests();

    expect(forgotten).toBe(1);
    expect((await userById(absent.id)).username).toBeNull();
    expect(await sessionsOf(absent.id)).toEqual([]);
    expect((await userById(active.id)).username).toBe("Renard 7");
    expect((await userById(bob.id)).username).toBe("bob");
  });

  it("supprime un invité absent qui n'a joué aucune partie", async () => {
    const { guest } = await createGuest(app, "Panda 1");
    await lastVisit(guest, 8);

    await forgetInactiveGuests();

    expect(await userById(guest.id)).toBeUndefined();
  });

  it("garde le pseudo de l'invité oublié dans l'historique des autres joueurs", async () => {
    const { guest } = await createGuest(app, "Hibou 3");
    const gameId = await gameWith(guest);
    await lastVisit(guest, 8);

    await forgetInactiveGuests();

    const history = (await app.inject({ method: "GET", url: `/api/users/${alice.id}/games` })).json<GameType[]>();
    const player = history.find((game) => game.id === gameId)!.players.find((p) => p.id === guest.id);
    expect(player).toMatchObject({ username: "Hibou 3", isAnonymous: true });
  });

  it("libère le pseudo de l'invité oublié", async () => {
    const { guest } = await createGuest(app, "Loutre 9");
    await gameWith(guest);
    await lastVisit(guest, 8);

    await forgetInactiveGuests();

    const { pseudo } = await createGuest(app, "Loutre 9");
    expect(pseudo.statusCode).toBe(200);
  });

  it("ne supprime pas un invité oublié avec les comptes inactifs depuis 3 ans", async () => {
    const { guest } = await createGuest(app, "Castor 5");
    await gameWith(guest);
    await lastVisit(guest, 8);
    await forgetInactiveGuests();
    await db
      .update(users)
      .set({ lastActiveAt: new Date(Date.now() - 4 * 365 * DAY) })
      .where(eq(users.id, guest.id));

    await purgeInactiveUsers();

    expect(await userById(guest.id)).toBeDefined();
  });
});
