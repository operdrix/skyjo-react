import dotenv from "dotenv";
import mysql from "mysql2/promise";

// Crée la base de test et donne les droits à l'utilisateur applicatif
export default async function setup() {
  dotenv.config();
  const { DB_HOST, DB_PORT, DB_USER, DB_ROOT_PASSWORD } = process.env;

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: "root",
    password: DB_ROOT_PASSWORD,
  });
  await connection.query("CREATE DATABASE IF NOT EXISTS skyjo_test");
  await connection.query("GRANT ALL PRIVILEGES ON skyjo_test.* TO ??@'%'", [DB_USER]);
  await connection.end();
}
