import type { FastifyInstance } from "fastify";
import {
	createGame,
	deleteGame,
	getGame,
	getGames,
	updateGame,
	updateGameSettings,
	type GameActionBody,
	type GamesQuery,
} from "../controllers/games.ts";
import { sendResult } from "./reply.ts";

type GameParams = { Params: { gameId: string } };

export function gamesRoutes(app: FastifyInstance) {

	// Liste des parties
	app.get<{ Querystring: GamesQuery }>("/api/games", {
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
		return sendResult(reply, await getGames(request.query));
	});

	// Consulter une partie
	app.get<GameParams>("/api/game/:gameId", {
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
		return sendResult(reply, await getGame(request.params.gameId));
	});

	// Création d'un jeu
	app.post<{ Body: { privateRoom?: boolean } }>("/api/game", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Créer une partie",
			description: "Crée une nouvelle partie (authentification requise)",
			security: [{ sessionCookie: [] }],
			body: {
				type: "object",
				properties: {
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
		return sendResult(reply, await createGame(request.user.id, request.body?.privateRoom));
	});

	// Rejoindre un jeu
	app.patch<{ Params: { action: string; gameId: string }; Body: GameActionBody }>("/api/game/:action/:gameId", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Action sur une partie",
			description: "Exécute une action sur une partie pour l'utilisateur connecté (join, leave ; start et finish réservés au créateur)",
			security: [{ sessionCookie: [] }],
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
					winner: { type: "string", description: "ID du gagnant (pour finish)" },
					winnerScore: { type: "number", description: "Score du gagnant (pour finish)" },
				},
			},
		},
	}, async (request, reply) => {
		const body = { ...request.body, userId: request.user.id };
		return sendResult(reply, await updateGame({ params: request.params, body }));
	});

	// Changer les paramètres d'une partie
	app.patch<GameParams & { Body: { maxPlayers?: number; private?: boolean } }>("/api/game/:gameId", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Modifier les paramètres d'une partie",
			description: "Modifie les paramètres d'une partie existante (réservé au créateur). Uniquement possible si la partie est en attente (pending).",
			security: [{ sessionCookie: [] }],
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
		return sendResult(reply, await updateGameSettings(request.params.gameId, request.body, request.user.id));
	});

	// Supprimer une partie
	app.delete<GameParams>("/api/game/:gameId", {
		preHandler: [app.authenticate],
		schema: {
			tags: ["Parties"],
			summary: "Supprimer une partie",
			description: "Supprime une partie existante (authentification requise)",
			security: [{ sessionCookie: [] }],
			params: {
				type: "object",
				properties: {
					gameId: { type: "string", description: "ID de la partie" },
				},
			},
		},
	}, async (request, reply) => {
		return sendResult(reply, await deleteGame(request.params.gameId, request.user.id));
	});
}
