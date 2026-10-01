import { buildApp } from "./app.js";
//bdd
import { sequelize } from "./bdd.js";
//redis
import { initRedis } from "./redis.js";
//logger
import { logger } from "./utils/logger.js";

import dotenv from "dotenv";

dotenv.config();

// Vérification des secrets obligatoires en production
if (process.env.NODE_ENV === "production") {
	const requiredSecrets = ["JWT_SECRET", "COOKIE_SECRET"];
	const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

	if (missingSecrets.length > 0) {
		logger.error(
			"❌ ERREUR CRITIQUE : Les secrets suivants sont manquants en production :",
			missingSecrets.join(", ")
		);
		logger.error("Définissez ces variables d'environnement avant de démarrer le serveur.");
		process.exit(1);
	}

	// Vérifier que les secrets sont suffisamment forts (minimum 32 caractères)
	const weakSecrets = requiredSecrets.filter(
		secret => process.env[secret] && process.env[secret].length < 32
	);

	if (weakSecrets.length > 0) {
		logger.error(
			"❌ ERREUR CRITIQUE : Les secrets suivants sont trop faibles (< 32 caractères) :",
			weakSecrets.join(", ")
		);
		logger.error("Utilisez des secrets d'au moins 32 caractères aléatoires.");
		process.exit(1);
	}

	logger.success("Secrets de production validés");
}

//Test de la connexion
const retrySequelizeConnection = async (retries = 10, delay = 5000) => {
	while (retries > 0) {
		try {
			await sequelize.authenticate();
			logger.success("Connecté à la base de données MySQL!");
			return;
		} catch (error) {
			logger.error(
				`Erreur de connexion à MySQL, tentatives restantes : ${retries}`,
				error.message
			);
			retries -= 1;
			await new Promise((resolve) => setTimeout(resolve, delay)); // Attendre avant de réessayer
		}
	}
	throw new Error("Impossible de se connecter à MySQL après plusieurs tentatives.");
};
try {
	await retrySequelizeConnection();
} catch (error) {
	logger.error("Erreur critique :", error.message);
	process.exit(1); // Arrêter le processus en cas d'échec total
}

// Initialiser Redis
await initRedis();

const app = await buildApp();

/**********
 * START
 **********/
const start = async () => {
	try {
		await sequelize
			.sync({ alter: true })
			.then(() => {
				logger.success("Base de données synchronisée.");
			})
			.catch((error) => {
				logger.error(
					"Erreur de synchronisation de la base de données :",
					error
				);
			});
		const port = process.env.PORT || 3000;
		const apiUrl = process.env.APP_URL || `http://localhost:${port}`;
		await app.listen({ port: parseInt(port), host: "0.0.0.0" });
		logger.success(
			`🚀 Serveur démarré sur ${apiUrl}`
		);
		logger.info(
			`📚 Documentation disponible sur ${apiUrl}/api/documentation`
		);
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};
start();
