import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";
import { logger } from "../utils/logger.ts";
import * as schema from "./schema.ts";

dotenv.config({ quiet: true });

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env;
if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD || !DB_PORT) {
  logger.error("Certaines variables d'environnement MySQL sont manquantes.");
  logger.error("DB_HOST:", DB_HOST || "(manquant)");
  logger.error("DB_NAME:", DB_NAME || "(manquant)");
  logger.error("DB_USER:", DB_USER || "(manquant)");
  logger.error("DB_PASSWORD:", DB_PASSWORD ? "***" : "(manquant)");
  logger.error("DB_PORT:", DB_PORT || "(manquant)");
  process.exit(1);
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  connectionLimit: 10,
});

export const db = drizzle({ client: pool, schema, mode: "default", casing: "snake_case" });

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../drizzle", import.meta.url));

// Applique les migrations drizzle-kit en attente
export async function runMigrations() {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
