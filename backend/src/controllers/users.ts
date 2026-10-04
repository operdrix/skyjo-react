import { eq, lt, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { sessions, users } from "../db/schema.ts";

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
export async function purgeInactiveUsers(now = new Date()) {
  const limit = new Date(now.getTime() - INACTIVITY_DAYS * 24 * 3600 * 1000);
  const [result] = await db.delete(users).where(sql`coalesce(${users.lastActiveAt}, ${users.createdAt}) < ${limit}`);
  return result.affectedRows;
}

// Supprime les sessions expirées (Better Auth les garde, avec l'adresse IP et le navigateur)
export async function purgeExpiredSessions(now = new Date()) {
  const [result] = await db.delete(sessions).where(lt(sessions.expiresAt, now));
  return result.affectedRows;
}
