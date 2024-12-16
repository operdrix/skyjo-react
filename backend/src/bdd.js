import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";
import dotenv from "dotenv";

dotenv.config();

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env;
if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD || !DB_PORT) {
	console.error("Certaines variables d'environnement MySQL sont manquantes.");
	console.log(DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT);

	process.exit(1);
}
/**
 * Connexion à la base de données
 */
export const sequelize = new Sequelize({
	dialect: MySqlDialect,
	database: DB_NAME,
	user: DB_USER,
	password: DB_PASSWORD,
	host: DB_HOST,
	port: parseInt(DB_PORT),
	pool: {
		max: 10,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
});
