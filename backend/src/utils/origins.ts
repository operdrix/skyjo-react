// Origines du front autorisées (CORS, websocket, Better Auth) : FRONTEND_HOST, éventuellement
// une liste séparée par des virgules (ex. un second front de comparaison en dev)
export function frontendOrigins(value: string | undefined): string[] {
	const origins = (value ?? "").split(",").map(origin => origin.trim()).filter(Boolean);
	return origins.length ? origins : ["http://localhost:5173"];
}
