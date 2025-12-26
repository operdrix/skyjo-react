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
		// Autoriser la valeur définie via FRONTEND_HOST ET localhost:4173 pour le dev (Vite)
		origin: [process.env.FRONTEND_HOST || "http://localhost:5173", "http://localhost:4173"],
		credentials: true,
	})
	.register(socketioServer, {
		cors: {
			origin: [process.env.FRONTEND_HOST || "http://localhost:5173", "http://localhost:4173"],
			credentials: true,
		},
	})
	.register(fastifySwagger, {
		openapi: {
			openapi: "3.0.0",
			info: {
				title: "API SkyJo d'Olivier",
				description:
					"API du jeu Skyjo développée avec Fastify, Sequelize et Socket.io",
				version: "1.0.0",
				contact: {
					name: "Olivier Perdrix",
					url: "https://labodolivier.com",
				},
			},
			servers: [
				{
					url: process.env.APP_URL || "http://localhost:3000",
					description: process.env.NODE_ENV === "production" ? "Serveur de production" : "Serveur de développement",
				},
			],
			tags: [
				{ name: "Authentification", description: "Gestion de l'authentification et des utilisateurs" },
				{ name: "Parties", description: "Gestion des parties de jeu" },
				{ name: "Système", description: "Routes système et informations" },
			],
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
		},
	})
	.register(fastifySwaggerUi, {
		routePrefix: "/api/documentation",
		theme: {
			title: "Documentation API Skyjo d'Olivier",
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
		transformSpecification: (swaggerObject, _request, _reply) => {
			return swaggerObject;
		},
		transformSpecificationClone: true,
	})
	.register(fastifyJWT, {
		secret: process.env.JWT_SECRET || "unanneaupourlesgouvernertous",
	});
/**********
 * Routes
 **********/

app.get("/api", {
	schema: {
		tags: ["Système"],
		summary: "Informations sur l'API",
		description: "Retourne l'URL de la documentation Swagger",
		response: {
			200: {
				type: "object",
				properties: {
					documentationURL: { type: "string" },
				},
			},
		},
	},
}, (_request, reply) => {
	const apiUrl = process.env.APP_URL || "http://localhost:3000";
	reply.send({ documentationURL: `${apiUrl}/api/documentation` });
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
		const port = process.env.PORT || 3000;
		const apiUrl = process.env.APP_URL || `http://localhost:${port}`;
		await app.listen({ port: parseInt(port), host: "0.0.0.0" });
		console.log(
			"Serveur Fastify lancé sur " + chalk.blue(`${apiUrl}`)
		);
		console.log(
			chalk.bgYellow(
				`Accéder à la documentation sur ${apiUrl}/api/documentation`
			)
		);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};
start();
