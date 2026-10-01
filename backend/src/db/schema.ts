import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";
import type { GameData } from "../../../shared/types.ts";

// createdAt / updatedAt, mis à jour côté application
const timestamps = {
  createdAt: timestamp({ fsp: 3 }).notNull().defaultNow(),
  updatedAt: timestamp({ fsp: 3 }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const users = mysqlTable("users", {
  id: varchar({ length: 32 }).primaryKey(),
  username: varchar({ length: 255 }).notNull().unique(),
  firstname: varchar({ length: 255 }).notNull(),
  lastname: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  bestScore: int(),
  verified: boolean().notNull().default(false),
  verifiedToken: varchar({ length: 255 }),
  verifiedTokenExpires: datetime({ fsp: 3 }),
  avatar: varchar({ length: 255 }),
  resetPasswordToken: varchar({ length: 255 }),
  resetPasswordExpires: datetime({ fsp: 3 }),
  ...timestamps,
});

export const games = mysqlTable("games", {
  id: varchar({ length: 16 }).primaryKey().$defaultFn(() => nanoid(5)),
  creator: varchar({ length: 32 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  winner: varchar({ length: 32 }).references(() => users.id, { onDelete: "set null" }),
  winnerScore: int(),
  state: mysqlEnum(["pending", "playing", "finished"]).notNull().default("pending"),
  roundNumber: int().notNull().default(0),
  private: boolean().notNull().default(false),
  maxPlayers: int().notNull().default(4),
  playersPlayAgain: json().$type<string[]>().notNull().$defaultFn(() => []),
  // Objet vide tant que la partie n'a pas démarré
  gameData: json().$type<GameData>().notNull().$defaultFn(() => ({}) as GameData),
  ...timestamps,
});

export const gamePlayers = mysqlTable("game_players", {
  gameId: varchar({ length: 16 }).notNull().references(() => games.id, { onDelete: "cascade" }),
  userId: varchar({ length: 32 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  score: int().notNull().default(0),
  scoreByRound: json().$type<number[]>().notNull().$defaultFn(() => []),
  status: mysqlEnum(["connected", "disconnected"]).notNull().default("connected"),
  ...timestamps,
}, (table) => [primaryKey({ columns: [table.gameId, table.userId] })]);

export const usersRelations = relations(users, ({ many }) => ({
  games: many(gamePlayers),
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
