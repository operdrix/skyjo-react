import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

// Recrée la base de test, donne les droits à l'utilisateur applicatif et applique les migrations
export default async function setup() {
  dotenv.config({ quiet: true });
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_ROOT_PASSWORD } = process.env;

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: "root",
    password: DB_ROOT_PASSWORD,
  });
  await connection.query("DROP DATABASE IF EXISTS skyjo_test");
  await connection.query("CREATE DATABASE skyjo_test");
  await connection.query("GRANT ALL PRIVILEGES ON skyjo_test.* TO ??@'%'", [DB_USER]);
  await connection.end();

  const client = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: "skyjo_test",
  });
  await migrate(drizzle({ client }), { migrationsFolder: "drizzle" });
  await client.end();
}
