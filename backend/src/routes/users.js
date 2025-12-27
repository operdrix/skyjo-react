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
import { addToBlacklist, isBlacklisted } from "../redis.js";

export function usersRoutes(app, blacklistedTokens) {
	app.post("/api/login", {
		config: {
			rateLimit: {
				max: 5,
				timeWindow: "5 minutes",
			},
		},
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
			// Créer un access token de courte durée
			const accessToken = app.jwt.sign(
				{
					id: response.user.id,
					username: response.user.username,
					email: response.user.email,
				},
				{ expiresIn: "15m" } // Access token valide 15 minutes
			);

			// Créer un refresh token de longue durée
			const refreshToken = app.jwt.sign(
				{
					id: response.user.id,
					username: response.user.username,
					email: response.user.email,
				},
				{ expiresIn: "14d" } // Refresh token valide 14 jours
			);

			// Définir les deux cookies httpOnly
			reply.setCookie("accessToken", accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 15 * 60, // 15 minutes en secondes
			});

			reply.setCookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 14 * 24 * 60 * 60, // 14 jours en secondes
			});

			// Renvoyer uniquement les infos utilisateur (pas les tokens)
			reply.send({ user: response.user });
		}
	}).post(
		"/api/auth/refresh",
		{
			config: {
				rateLimit: {
					max: 10,
					timeWindow: "1 minute",
				},
			},
			schema: {
				tags: ["Authentification"],
				summary: "Renouvellement du token d'accès",
				description: "Utilise le refresh token pour obtenir un nouvel access token",
				response: {
					200: {
						type: "object",
						properties: {
							success: { type: "boolean" },
						},
					},
					401: {
						type: "object",
						properties: {
							error: { type: "string" },
						},
					},
				},
			},
		},
		async (request, reply) => {
			try {
				const refreshToken = request.cookies.refreshToken;

				if (!refreshToken) {
					return reply.status(401).send({ error: "Refresh token manquant" });
				}

				// Vérifier si le refresh token est dans la liste noire (Redis ou mémoire)
				const isTokenBlacklisted = await isBlacklisted(refreshToken);
				if (isTokenBlacklisted || blacklistedTokens.includes(refreshToken)) {
					return reply.status(401).send({ error: "Refresh token invalide" });
				}

				// Vérifier et décoder le refresh token
				const decoded = app.jwt.verify(refreshToken);

				// Créer un nouvel access token
				const newAccessToken = app.jwt.sign(
					{
						id: decoded.id,
						username: decoded.username,
						email: decoded.email,
					},
					{ expiresIn: "15m" } // Access token valide 15 minutes
				);

				// Définir le nouveau cookie access token
				reply.setCookie("accessToken", newAccessToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					path: "/",
					maxAge: 15 * 60, // 15 minutes en secondes
				});

				reply.send({ success: true });
			} catch {
				reply.status(401).send({ error: "Refresh token invalide ou expiré" });
			}
		}
	).post(
		"/api/logout",
		{
			schema: {
				tags: ["Authentification"],
				summary: "Déconnexion utilisateur",
				description: "Déconnecte l'utilisateur en ajoutant ses tokens à la liste noire et en supprimant les cookies",
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
			// Récupérer les tokens depuis les cookies
			const accessToken = request.cookies.accessToken;
			const refreshToken = request.cookies.refreshToken;

			// Ajouter les tokens à la liste noire Redis (fallback en mémoire)
			if (accessToken) {
				const added = await addToBlacklist(accessToken, 15 * 60); // 15 minutes
				if (!added) {
					// Fallback en mémoire si Redis n'est pas disponible
					blacklistedTokens.push(accessToken);
				}
			}
			if (refreshToken) {
				const added = await addToBlacklist(refreshToken, 14 * 24 * 60 * 60); // 14 jours
				if (!added) {
					// Fallback en mémoire si Redis n'est pas disponible
					blacklistedTokens.push(refreshToken);
				}
			}

			// Supprimer les deux cookies
			reply.clearCookie("accessToken", { path: "/" });
			reply.clearCookie("refreshToken", { path: "/" });
			reply.send({ logout: true });
		}
	);
	//inscription
	app.post("/api/register", {
		config: {
			rateLimit: {
				max: 3,
				timeWindow: "10 minutes",
			},
		},
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
		config: {
			rateLimit: {
				max: 10,
				timeWindow: "5 minutes",
			},
		},
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

	// Vérification du token jwt (depuis cookie ou header)
	app.get("/api/auth/verify", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Authentification"],
			summary: "Vérification du token JWT",
			description: "Vérifie la validité d'un token JWT depuis un cookie httpOnly ou header Authorization",
			security: [{ bearerAuth: [] }],
			response: {
				200: {
					type: "object",
					properties: {
						valid: { type: "boolean" },
						user: {
							type: "object",
							properties: {
								id: { type: "string" },
								username: { type: "string" },
							}
						}
					}
				}
			}
		},
	}, async (request, reply) => {
		// Si on arrive ici, c'est que le middleware authenticate a validé le token
		reply.send({
			valid: true,
			user: {
				id: request.user.id,
				username: request.user.username
			}
		});
	});

	app.post("/api/password-reset-request", {
		config: {
			rateLimit: {
				max: 3,
				timeWindow: "10 minutes",
			},
		},
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
		config: {
			rateLimit: {
				max: 5,
				timeWindow: "10 minutes",
			},
		},
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
