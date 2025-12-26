import { createGame, deleteGame, getGame, getGames, updateGame, updateGameSettings } from "../controllers/games.js";

export function gamesRoutes(app) {

	// Liste des parties
	app.get("/api/games", {
		schema: {
			tags: ["Parties"],
			summary: "Liste des parties",
			description: "Récupère la liste de toutes les parties disponibles",
			querystring: {
				type: "object",
				properties: {
					status: { type: "string", description: "Filtrer par statut (waiting, playing, finished)" },
					private: { type: "boolean", description: "Filtrer les parties privées" },
				},
			},
		},
	}, async (request, reply) => {
		const response = await getGames(request.query);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

	// Consulter une partie
	app.get("/api/game/:gameId", {
		schema: {
			tags: ["Parties"],
			summary: "Détails d'une partie",
			description: "Récupère les détails d'une partie spécifique",
			params: {
				type: "object",
				properties: {
					gameId: { type: "string", description: "ID de la partie" },
				},
			},
		},
	}, async (request, reply) => {
		const response = await getGame(request.params.gameId);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

	// Création d'un jeu
	app.post("/api/game", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Créer une partie",
			description: "Crée une nouvelle partie (authentification requise)",
			security: [{ bearerAuth: [] }],
			body: {
				type: "object",
				required: ["userId"],
				properties: {
					userId: { type: "string", description: "ID de l'utilisateur créateur" },
					privateRoom: { type: "boolean", description: "Partie privée ou publique", default: false },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						gameId: { type: "string", description: "ID de la partie créée" },
					},
				},
			},
		},
	}, async (request, reply) => {
		const response = await createGame(request.body.userId, request.body.privateRoom);
		if (response.error) {
			reply.status(response.code || 400).send(response); // Utilisez le code HTTP approprié
		} else {
			reply.send(response);
		}
	});

	// Rejoindre un jeu
	app.patch("/api/game/:action/:gameId", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Action sur une partie",
			description: "Exécute une action sur une partie (join, leave, start, finish)",
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				properties: {
					action: { type: "string", enum: ["join", "leave", "start", "finish"], description: "Action à effectuer" },
					gameId: { type: "string", description: "ID de la partie" },
				},
			},
			body: {
				type: "object",
				properties: {
					userId: { type: "string", description: "ID du joueur (requis pour join/leave)" },
					winner: { type: "string", description: "ID du gagnant (pour finish)" },
					winnerScore: { type: "number", description: "Score du gagnant (pour finish)" },
				},
			},
		},
	}, async (request, reply) => {
		const response = await updateGame(request);
		if (response.error) {
			reply.status(response.code || 400).send(response); // Utilisez le code HTTP approprié
		} else {
			reply.send(response);
		}
	});

	// Changer les paramètres d'une partie
	app.patch("/api/game/:gameId", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Modifier les paramètres d'une partie",
			description: "Modifie les paramètres d'une partie existante (authentification requise). Uniquement possible si la partie est en attente (pending).",
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				properties: {
					gameId: { type: "string", description: "ID de la partie" },
				},
			},
			body: {
				type: "object",
				properties: {
					maxPlayers: { type: "number", minimum: 2, maximum: 8, description: "Nombre maximum de joueurs" },
					private: { type: "boolean", description: "Partie privée ou publique" },
				},
			},
		},
	}, async (request, reply) => {
		const response = await updateGameSettings(request.params.gameId, request.body);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

	// Supprimer une partie
	app.delete("/api/game/:gameId", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Supprimer une partie",
			description: "Supprime une partie existante (authentification requise)",
			security: [{ bearerAuth: [] }],
			params: {
				type: "object",
				properties: {
					gameId: { type: "string", description: "ID de la partie" },
				},
			},
		},
	}, async (request, reply) => {
		const response = await deleteGame(request.params.gameId, request.user.id);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
}
