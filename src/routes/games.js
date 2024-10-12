import { createGame, getGame, updateGame, updateGameSettings } from "../controllers/games.js";
export function gamesRoutes(app) {
	// Consulter une partie
	app.get("/game/:gameId",
		async (request, reply) => {
			reply.send(await getGame(request.params.gameId));
		});

	//création d'un jeu
	app.post(
		"/game",
		{ preHandler: [app.authenticate] },
		async (request, reply) => {
			reply.send(await createGame(request.body.userId, request.body.privateRoom));
		}
	);
	//rejoindre un jeu
	app.patch(
		"/game/:action/:gameId",
		{ preHandler: [app.authenticate] },
		async (request, reply) => {
			reply.send(await updateGame(request));
		}
	);
	//changer les paramètres d'une partie
	app.patch(
		"/game/:gameId",
		{ preHandler: [app.authenticate] },
		async (request, reply) => {
			console.log(request.body);

			reply.send(await updateGameSettings(request.params.gameId, request.body));
		}
	);
}
