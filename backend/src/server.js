import chalk from "chalk";
//pour fastify
import cors from "@fastify/cors";
import fastifyJWT from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import socketioServer from "fastify-socket.io";
//routes
import { gamesRoutes } from "./routes/games.js";
import { usersRoutes } from "./routes/users.js";
//websockets
import { websockets } from "./websockets/websockets.js";
//bdd
import { sequelize } from "./bdd.js";

import dotenv from "dotenv";

dotenv.config();

//Test de la connexion
const retrySequelizeConnection = async (retries = 10, delay = 5000) => {
	while (retries > 0) {
		try {
			await sequelize.authenticate();
			console.log(chalk.green("Connecté à la base de données MySQL!"));
			return;
		} catch (error) {
			console.error(
				chalk.red(`Erreur de connexion à MySQL, tentatives restantes : ${retries}`),
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
	console.error(chalk.red("Erreur critique :"), error.message);
	process.exit(1); // Arrêter le processus en cas d'échec total
}

/**
 * API
 * avec fastify
 */
let blacklistedTokens = [];
const app = fastify();
//Ajout du plugin fastify-bcrypt pour le hash du mdp
await app
	.register(fastifyBcrypt, {
		saltWorkFactor: 12,
	})
	.register(cors, {
		origin: "*",
	})
	.register(socketioServer, {
		cors: {
			origin: "*",
		},
	})
	.register(fastifySwagger, {
		openapi: {
			openapi: "3.0.0",
			info: {
				title: "Documentation de l'API SkyJo",
				description:
					"API développée pour un exercice avec React avec Fastify et Sequelize",
				version: "0.1.0",
			},
		},
	})
	.register(fastifySwaggerUi, {
		routePrefix: "/documentation",
		theme: {
			title: "Docs - JDR LOTR API",
		},
		uiConfig: {
			docExpansion: "list",
			deepLinking: false,
		},
		uiHooks: {
			onRequest: function (request, reply, next) {
				next();
			},
			preHandler: function (request, reply, next) {
				next();
			},
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject, request, reply) => {
			return swaggerObject;
		},
		transformSpecificationClone: true,
	})
	.register(fastifyJWT, {
		secret: "unanneaupourlesgouvernertous",
	});
/**********
 * Routes
 **********/

app.get("/api", (request, reply) => {
	reply.send({ documentationURL: "http://localhost:3000/api/documentation" });
});
// Fonction pour décoder et vérifier le token
app.decorate("authenticate", async (request, reply) => {
	try {
		const token = request.headers["authorization"].split(" ")[1];

		// Vérifier si le token est dans la liste noire
		if (blacklistedTokens.includes(token)) {
			return reply
				.status(401)
				.send({ error: "Token invalide ou expiré" });
		}
		await request.jwtVerify();
	} catch (err) {
		reply.send(err);
	}
});
//gestion utilisateur
usersRoutes(app, blacklistedTokens);
//gestion des jeux
gamesRoutes(app);

/**********
 * Socket.io
 * pour la gestion du jeu
 * **********/
websockets(app);

/**********
 * START
 **********/
const start = async () => {
	try {
		await sequelize
			.sync({ alter: true })
			.then(() => {
				console.log(chalk.green("Base de données synchronisée."));
			})
			.catch((error) => {
				console.error(
					"Erreur de synchronisation de la base de données :",
					error
				);
			});
		await app.listen({ port: 3000, host: '0.0.0.0' });
		console.log(
			"Serveur Fastify lancé sur " + chalk.blue("http://localhost:3000")
		);
		console.log(
			chalk.bgYellow(
				"Accéder à la documentation sur http://localhost:3000/documentation"
			)
		);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};
start();
