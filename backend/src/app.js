//pour fastify
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import fastifyJWT from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
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
import { isBlacklisted } from "./redis.js";

// Construit l'application Fastify (plugins, routes, websockets) sans la démarrer
export async function buildApp() {
	/**
	 * API
	 * avec fastify
	 */
	const blacklistedTokens = [];
	const app = fastify({
		bodyLimit: 1048576, // Limite de 1MB pour éviter les attaques DoS
	});
	//Ajout du plugin fastify-bcrypt pour le hash du mdp
	await app
		.register(helmet, {
			// Configuration des headers de sécurité
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					styleSrc: ["'self'", "'unsafe-inline'"], // Pour Swagger UI
					scriptSrc: ["'self'", "'unsafe-inline'"], // Pour Swagger UI
					imgSrc: ["'self'", "data:", "https:"],
					connectSrc: ["'self'"],
				},
			},
			// Désactiver X-Powered-By pour ne pas exposer Fastify
			hidePoweredBy: true,
			// Forcer HTTPS en production
			hsts: process.env.NODE_ENV === "production" ? {
				maxAge: 31536000, // 1 an
				includeSubDomains: true,
				preload: true,
			} : false,
		})
		.register(rateLimit, {
			global: false, // Pas de limite globale, on configure par route
			max: 100,
			timeWindow: "1 minute",
			cache: 10000,
			allowList: ["127.0.0.1"], // Pas de limite pour localhost en dev
			skipOnError: true,
		})
		.register(cookie, {
			secret: process.env.COOKIE_SECRET || "mon-secret-de-cookie-super-secret",
			parseOptions: {},
		})
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
	// Fonction pour décoder et vérifier le token (access token)
	app.decorate("authenticate", async (request, reply) => {
		try {
			// Essayer de récupérer l'access token depuis le cookie d'abord, sinon depuis l'header Authorization
			let token = request.cookies.accessToken;

			if (!token && request.headers["authorization"]) {
				token = request.headers["authorization"].split(" ")[1];
			}

			if (!token) {
				return reply.status(401).send({ error: "Access token manquant" });
			}

			// Vérifier si le token est dans la liste noire (Redis ou mémoire)
			const isTokenBlacklisted = await isBlacklisted(token);
			if (isTokenBlacklisted || blacklistedTokens.includes(token)) {
				return reply
					.status(401)
					.send({ error: "Access token invalide ou expiré" });
			}

			// Vérifier et décoder le token JWT
			const decoded = app.jwt.verify(token);

			// Ajouter les infos utilisateur décodées à la requête
			request.user = decoded;

			// Si le token vient du cookie, on le met aussi dans l'header pour cohérence
			if (!request.headers["authorization"]) {
				request.headers["authorization"] = `Bearer ${token}`;
			}
		} catch (err) {
			reply.status(401).send({ error: "Access token invalide ou expiré", errorDetails: err });
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

	return app;
}
