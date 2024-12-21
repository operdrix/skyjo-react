import { createGame, getGame, updateGame, updateGameSettings } from "../controllers/games.js";

export function gamesRoutes(app) {
	// Consulter une partie
	app.get("/api/game/:gameId", async (request, reply) => {
		const response = await getGame(request.params.gameId);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

	// Création d'un jeu
	app.post("/api/game", { preHandler: [app.authenticate] }, async (request, reply) => {
		const response = await createGame(request.body.userId, request.body.privateRoom);
		if (response.error) {
			reply.status(response.code || 400).send(response); // Utilisez le code HTTP approprié
		} else {
			reply.send(response);
		}
	});

	// Rejoindre un jeu
	app.patch("/api/game/:action/:gameId", { preHandler: [app.authenticate] }, async (request, reply) => {
		const response = await updateGame(request);
		if (response.error) {
			reply.status(response.code || 400).send(response); // Utilisez le code HTTP approprié
		} else {
			reply.send(response);
		}
	});

	// Changer les paramètres d'une partie
	app.patch("/api/game/:gameId", { preHandler: [app.authenticate] }, async (request, reply) => {
		const response = await updateGameSettings(request.params.gameId, request.body);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
}
