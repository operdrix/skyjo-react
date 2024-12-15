import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import dotenv from "dotenv";

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
console.log(process.env.NODE_ENV);

/**
 * Connexion à la base de données
 */
export const sequelize = new Sequelize({
	dialect: MySqlDialect,
	database: process.env.DB_NAME || "database_name",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	host: process.env.DB_HOST || "localhost",
	port: parseInt(process.env.DB_PORT) || 3306,
});
