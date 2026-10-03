import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";

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
