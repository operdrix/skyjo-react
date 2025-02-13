import { createGame, deleteGame, getGame, getGames, updateGame, updateGameSettings } from "../controllers/games.js";

export function gamesRoutes(app) {

	// Liste des parties
	app.get("/api/games", async (request, reply) => {
		const response = await getGames(request.query);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});

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

	// Supprimer une partie
	app.delete("/api/game/:gameId", { preHandler: [app.authenticate] }, async (request, reply) => {
		const response = await deleteGame(request.params.gameId, request.user.id);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
}
