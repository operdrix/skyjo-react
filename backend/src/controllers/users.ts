import { and, eq, gt, inArray, isNotNull, isNull, lt, notExists, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { gamePlayers, games, sessions, users } from "../db/schema.ts";
import { renamePlayer } from "../game/players.ts";

// Profil public d'un joueur (ni email ni données de connexion)
const PROFILE = {
  id: users.id,
  username: users.username,
  bestScore: users.bestScore,
  image: users.image,
};

export async function getUsers() {
  return db.select(PROFILE).from(users);
}

export async function getUserById(id: string) {
  const [user] = await db.select(PROFILE).from(users).where(eq(users.id, id));
  return user ?? null;
}

// Durée d'inactivité au-delà de laquelle un compte est supprimé (recommandation CNIL)
export const INACTIVITY_DAYS = 3 * 365;

// Supprime les comptes sans connexion depuis INACTIVITY_DAYS (date d'inscription à défaut).
// Les sessions, moyens de connexion, parties créées et participations suivent par cascade.
// Les invités ne sont pas concernés : ils sont oubliés bien avant (forgetInactiveGuests), et leur pseudo
// reste affiché dans l'historique des autres joueurs.
export async function purgeInactiveUsers(now = new Date()) {
  const limit = new Date(now.getTime() - INACTIVITY_DAYS * 24 * 3600 * 1000);
  const [result] = await db
    .delete(users)
    .where(and(eq(users.isAnonymous, false), sql`coalesce(${users.lastActiveAt}, ${users.createdAt}) < ${limit}`));
  return result.affectedRows;
}

// Invités sans session valide (session de 7 jours, prolongée à chaque visite) : ceux qui ont joué sont oubliés
// (sessions supprimées, pseudo libéré mais gardé en nom affiché dans l'historique des autres), les autres supprimés.
// Renvoie le nombre d'invités oubliés ou supprimés.
export async function forgetInactiveGuests(now = new Date()) {
  const validSession = db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, users.id), gt(sessions.expiresAt, now)));
  const played = db.select({ id: gamePlayers.userId }).from(gamePlayers).where(eq(gamePlayers.userId, users.id));
  const inactive = await db
    .select({ id: users.id, played: sql<number>`exists(${played})` })
    .from(users)
    .where(and(eq(users.isAnonymous, true), isNotNull(users.username), notExists(validSession)));
  const withoutSession = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.isAnonymous, true), isNull(users.username), notExists(validSession), notExists(played)));

  const toForget = inactive.filter((guest) => guest.played).map((guest) => guest.id);
  const toDelete = [...inactive.filter((guest) => !guest.played), ...withoutSession].map((guest) => guest.id);
  if (toForget.length) {
    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(inArray(sessions.userId, toForget));
      await tx
        .update(users)
        .set({ name: sql`${users.username}`, username: null })
        .where(inArray(users.id, toForget));
    });
  }
  if (toDelete.length) {
    await db.delete(users).where(inArray(users.id, toDelete));
  }
  return toForget.length + toDelete.length;
}

// Supprime les sessions expirées (Better Auth les garde, avec l'adresse IP et le navigateur)
export async function purgeExpiredSessions(now = new Date()) {
  const [result] = await db.delete(sessions).where(lt(sessions.expiresAt, now));
  return result.affectedRows;
}

// Pseudos d'invités libérés le temps de leur inscription (rendus si l'inscription échoue)
const freedGuestUsernames = new Map<string, string>();

// Invité devenu compte (inscription, connexion ou Google) : ses parties passent au compte,
// et le compte sans pseudo (Google) reprend celui de l'invité. Le compte invité est ensuite supprimé par Better Auth.
export async function linkGuestAccount(guestId: string, userId: string) {
  await db.transaction(async (tx) => {
    const guestGames = tx.select({ id: gamePlayers.gameId }).from(gamePlayers).where(eq(gamePlayers.userId, guestId));
    const rows = await tx.select().from(games).where(inArray(games.id, guestGames)).for("update");
    const shared = await tx
      .select({ gameId: gamePlayers.gameId })
      .from(gamePlayers)
      .where(and(eq(gamePlayers.userId, userId), inArray(gamePlayers.gameId, guestGames)));

    for (const game of rows) {
      // Partie où le compte joue déjà : l'invité en sera retiré avec son compte
      if (shared.some((row) => row.gameId === game.id)) continue;
      const rename = (id: string | null) => (id === guestId ? userId : id);
      await tx
        .update(gamePlayers)
        .set({ userId })
        .where(and(eq(gamePlayers.gameId, game.id), eq(gamePlayers.userId, guestId)));
      await tx
        .update(games)
        .set({
          gameData: renamePlayer(game.gameData, guestId, userId),
          playersPlayAgain: game.playersPlayAgain.map((id) => rename(id)!),
          winner: rename(game.winner),
        })
        .where(eq(games.id, game.id));
    }

    const [guest] = await tx.select({ username: users.username }).from(users).where(eq(users.id, guestId));
    const [user] = await tx.select({ username: users.username }).from(users).where(eq(users.id, userId));
    if (guest?.username && !user?.username) {
      await tx.update(users).set({ username: null }).where(eq(users.id, guestId));
      await tx.update(users).set({ username: guest.username }).where(eq(users.id, userId));
    }
  });
  freedGuestUsernames.delete(guestId);
}

// Un invité qui s'inscrit avec son propre pseudo : le pseudo est libéré pour le nouveau compte
export async function freeGuestUsername(guestId: string, username: string) {
  const [guest] = await db.select({ username: users.username }).from(users).where(eq(users.id, guestId));
  if (!guest?.username || guest.username.toLowerCase() !== username.trim().toLowerCase()) return;
  await db.update(users).set({ username: null }).where(eq(users.id, guestId));
  freedGuestUsernames.set(guestId, guest.username);
}

// Après l'inscription : rend son pseudo à l'invité si elle a échoué
export async function restoreGuestUsername(guestId: string, signedUp: boolean) {
  const username = freedGuestUsernames.get(guestId);
  freedGuestUsernames.delete(guestId);
  if (username && !signedUp) {
    await db.update(users).set({ username }).where(eq(users.id, guestId));
  }
}
