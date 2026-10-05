import { relations } from "drizzle-orm";
import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";
import type { GameData } from "../../../shared/types.ts";

// createdAt / updatedAt, mis à jour côté application
const timestamps = {
  createdAt: timestamp({ fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp({ fsp: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// Tables d'authentification gérées par Better Auth (src/auth.ts) : users, sessions, accounts, verifications.
// Données personnelles limitées au pseudo et à l'email ; name vient de Google (sert à proposer un pseudo).
export const users = mysqlTable("users", {
  id: varchar({ length: 36 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  // Pseudo : absent juste après une première connexion Google, le temps de le choisir
  username: varchar({ length: 30 }).unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: varchar({ length: 255 }),
  bestScore: int(),
  // Dernière connexion : les comptes inactifs depuis 3 ans sont supprimés (purgeInactiveUsers)
  lastActiveAt: timestamp({ fsp: 3 }),
  // Thème d'affichage choisi (tapis, neon, confettis), copié en local par le front
  theme: varchar({ length: 16 }).notNull().default("tapis"),
  ...timestamps,
});

export const sessions = mysqlTable("sessions", {
  id: varchar({ length: 36 }).primaryKey(),
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp({ fsp: 3 }).notNull(),
  ipAddress: varchar({ length: 255 }),
  userAgent: varchar({ length: 1024 }),
  userId: varchar({ length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

// Moyens de connexion d'un utilisateur : "credential" (mot de passe haché) ou "google"
export const accounts = mysqlTable("accounts", {
  id: varchar({ length: 36 }).primaryKey(),
  accountId: varchar({ length: 255 }).notNull(),
  providerId: varchar({ length: 255 }).notNull(),
  userId: varchar({ length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ fsp: 3 }),
  refreshTokenExpiresAt: timestamp({ fsp: 3 }),
  scope: varchar({ length: 1024 }),
  password: varchar({ length: 255 }),
  ...timestamps,
});

// Jetons temporaires (réinitialisation de mot de passe, état OAuth)
export const verifications = mysqlTable("verifications", {
  id: varchar({ length: 36 }).primaryKey(),
  identifier: varchar({ length: 255 }).notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ fsp: 3 }).notNull(),
  ...timestamps,
});

export const games = mysqlTable("games", {
  id: varchar({ length: 16 })
    .primaryKey()
    .$defaultFn(() => nanoid(5)),
  creator: varchar({ length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  winner: varchar({ length: 36 }).references(() => users.id, { onDelete: "set null" }),
  winnerScore: int(),
  state: mysqlEnum(["pending", "playing", "finished"]).notNull().default("pending"),
  roundNumber: int().notNull().default(0),
  private: boolean().notNull().default(false),
  maxPlayers: int().notNull().default(4),
  playersPlayAgain: json()
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  // Partie créée par « Rejouer » : une seule par partie terminée
  nextGameId: varchar({ length: 16 }),
  // Objet vide tant que la partie n'a pas démarré
  gameData: json()
    .$type<GameData>()
    .notNull()
    .$defaultFn(() => ({}) as GameData),
  ...timestamps,
});

export const gamePlayers = mysqlTable(
  "game_players",
  {
    gameId: varchar({ length: 16 })
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: varchar({ length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: int().notNull().default(0),
    scoreByRound: json()
      .$type<number[]>()
      .notNull()
      .$defaultFn(() => []),
    status: mysqlEnum(["connected", "disconnected"]).notNull().default("connected"),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.gameId, table.userId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  games: many(gamePlayers),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  players: many(gamePlayers),
  creatorPlayer: one(users, { fields: [games.creator], references: [users.id] }),
}));

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  game: one(games, { fields: [gamePlayers.gameId], references: [games.id] }),
  user: one(users, { fields: [gamePlayers.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GamePlayerRow = typeof gamePlayers.$inferSelect;
