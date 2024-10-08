import {
	getUserById,
	getUsers,
	loginUser,
	registerUser,
	verifyUser,
} from "../controllers/users.js";
export function usersRoutes(app, blacklistedTokens) {
	app.post("/login", async (request, reply) => {
		const response = await loginUser(request.body, app);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	}).post(
		"/logout",
		{ preHandler: [app.authenticate] },
		async (request, reply) => {
			const token = request.headers["authorization"].split(" ")[1]; // Récupérer le token depuis l'en-tête Authorization

			// Ajouter le token à la liste noire
			blacklistedTokens.push(token);

			reply.send({ logout: true });
		}
	);
	//inscription
	app.post("/register", async (request, reply) => {
		const response = await registerUser(request.body, app.bcrypt);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
	//récupération de la liste des utilisateurs
	app.get("/users", async (request, reply) => {
		reply.send(await getUsers());
	});
	//récupération d'un utilisateur par son id
	app.get("/users/:id", async (request, reply) => {
		reply.send(await getUserById(request.params.id));
	});
	// Vérification de l'email de l'utilisateur via le token
	app.get("/verify/:token", async (request, reply) => {
		const response = await verifyUser(request.params.token);
		if (response.error) {
			reply.status(response.code).send(response);
		} else {
			reply.send(response);
		}
	});
}
