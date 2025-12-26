import { getUserGames } from "../controllers/games.js";
import {
	getUserById,
	getUsers,
	loginUser,
	registerUser,
	requestPasswordReset,
	resetPassword,
	verifyUser,
} from "../controllers/users.js";

export function usersRoutes(app, blacklistedTokens) {
	app.post("/api/login", {
		schema: {
			tags: ["Authentification"],
			summary: "Connexion utilisateur",
			description: "Authentifie un utilisateur et retourne un token JWT",
			body: {
				type: "object",
				required: ["email", "password"],
				properties: {
					email: { type: "string", format: "email" },
					password: { type: "string", minLength: 6 },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						user: {
							type: "object",
							properties: {
								id: { type: "string", description: "ID de l'utilisateur" },
								username: { type: "string", description: "Nom d'utilisateur" },
								firstname: { type: "string", description: "Prénom" },
								lastname: { type: "string", description: "Nom" },
								email: { type: "string", description: "Email" },
								avatar: { type: "string", description: "Avatar" },
							},
						},
					},
				},
			},
		},
	}, async (request, reply) => {
		const response = await loginUser(request.body, app);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			// Définir le cookie httpOnly avec le token
			reply.setCookie("authToken", response.token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 14 * 24 * 60 * 60, // 14 jours en secondes
			});
			// Renvoyer uniquement les infos utilisateur (pas le token)
			reply.send({ user: response.user });
		}
	}).post(
		"/api/logout",
		{
			preHandler: [app.authenticate],
			schema: {
				tags: ["Authentification"],
				summary: "Déconnexion utilisateur",
				description: "Déconnecte l'utilisateur en ajoutant son token à la liste noire",
				security: [{ bearerAuth: [] }],
				response: {
					200: {
						type: "object",
						properties: {
							logout: { type: "boolean" },
						},
					},
				},
			},
		},
		async (request, reply) => {
			// Récupérer le token depuis le cookie ou l'header
			let token = request.cookies.authToken;
			if (!token && request.headers["authorization"]) {
				token = request.headers["authorization"].split(" ")[1];
			}

			// Ajouter le token à la liste noire
			if (token) {
				blacklistedTokens.push(token);
			}

			// Supprimer le cookie
			reply.clearCookie("authToken", { path: "/" });
			reply.send({ logout: true });
		}
	);
	//inscription
	app.post("/api/register", {
		schema: {
			tags: ["Authentification"],
			summary: "Inscription utilisateur",
			description: "Crée un nouveau compte utilisateur",
			body: {
				type: "object",
				required: ["firstname", "lastname", "username", "email", "password"],
				properties: {
					firstname: { type: "string", minLength: 1, description: "Prénom" },
					lastname: { type: "string", minLength: 1, description: "Nom" },
					username: { type: "string", minLength: 3, description: "Nom d'utilisateur" },
					email: { type: "string", format: "email", description: "Adresse email" },
					password: { type: "string", minLength: 6, description: "Mot de passe" },
					avatar: { type: "string", description: "URL de l'avatar (optionnel)" },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						id: { type: "string" },
						username: { type: "string" },
						email: { type: "string" },
					},
				},
			},
		},
	}, async (request, reply) => {
		const response = await registerUser(request.body, app.bcrypt);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
	//récupération de la liste des utilisateurs
	app.get("/api/users", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Authentification"],
			summary: "Liste des utilisateurs",
			description: "Récupère la liste de tous les utilisateurs (authentification requise)",
			security: [{ bearerAuth: [] }],
		},
	}, async (request, reply) => {
		reply.send(await getUsers());
	});
	//récupération d'un utilisateur par son id
	app.get("/api/users/:id", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Authentification"],
			summary: "Détails d'un utilisateur",
			description: "Récupère les informations d'un utilisateur par son ID",
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				properties: {
					id: { type: "number", description: "ID de l'utilisateur" },
				},
			},
		},
	}, async (request, reply) => {
		reply.send(await getUserById(request.params.id));
	});
	//Récupération des parties d'un utilisateur
	app.get("/api/users/:id/games", {
		schema: {
			tags: ["Parties"],
			summary: "Parties d'un utilisateur",
			description: "Récupère toutes les parties d'un utilisateur",
			params: {
				type: "object",
				properties: {
					id: { type: "string", description: "ID de l'utilisateur" },
				},
			},
		},
	}, async (request, reply) => {
		reply.send(await getUserGames(request.params.id));
	});
	// Vérification de l'email de l'utilisateur via le token
	app.get("/api/verify/:token", {
		schema: {
			tags: ["Authentification"],
			summary: "Vérification d'email",
			description: "Vérifie l'email d'un utilisateur via le token reçu par email",
			params: {
				type: "object",
				properties: {
					token: { type: "string", description: "Token de vérification" },
				},
			},
		},
	}, async (request, reply) => {
		const response = await verifyUser(request.params.token);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

	// Vérification du token jwt
	app.get("/api/auth/verify", {
		schema: {
			tags: ["Authentification"],
			summary: "Vérification du token JWT",
			description: "Vérifie la validité d'un token JWT",
			security: [{ bearerAuth: [] }],
		},
	}, async (request, reply) => {
		const bearer = request.headers["authorization"];
		if (!bearer) {
			reply.status(401).send({ error: "Token manquant" });
			return;
		}
		const token = bearer.split(" ")[1];
		// Vérifier si le token est dans la liste noire
		if (blacklistedTokens.includes(token)) {
			reply.status(401).send({ error: "Token invalide ou expiré" });
			return;
		}
		try {
			const decoded = app.jwt.verify(token);
			reply.send(decoded);
		} catch (error) {
			reply.status(401).send({ error: "Token invalide", errDetails: error });
		}
	});

	app.post("/api/password-reset-request", {
		schema: {
			tags: ["Authentification"],
			summary: "Demande de réinitialisation de mot de passe",
			description: "Envoie un email avec un lien pour réinitialiser le mot de passe",
			body: {
				type: "object",
				required: ["email"],
				properties: {
					email: { type: "string", format: "email" },
				},
			},
		},
	}, async (request, reply) => {
		const { email } = request.body;
		const response = await requestPasswordReset(email);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

	app.post("/api/password-reset/:token", {
		schema: {
			tags: ["Authentification"],
			summary: "Réinitialisation de mot de passe",
			description: "Réinitialise le mot de passe avec le token reçu par email",
			params: {
				type: "object",
				properties: {
					token: { type: "string", description: "Token de réinitialisation" },
				},
			},
			body: {
				type: "object",
				required: ["newPassword"],
				properties: {
					newPassword: { type: "string", minLength: 6 },
				},
			},
		},
	}, async (request, reply) => {
		const { token } = request.params;
		const { newPassword } = request.body;
		const response = await resetPassword(token, newPassword, app.bcrypt);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
}
