import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { io as connectClient, type Socket } from "socket.io-client";
import { buildApp } from "../src/app.ts";
import { db } from "../src/db/index.ts";
import type { GameData } from "../../shared/types.ts";
import { accounts, gamePlayers, games, sessions, users, verifications } from "../src/db/schema.ts";

const PASSWORD = "secret-de-test";

export type TestPlayer = { id: string; cookies: Record<string, string> };

// App neuve sur une base vide (schéma créé par test/global-setup.ts)
export async function setupApp() {
  await db.delete(gamePlayers);
  await db.delete(games);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(verifications);
  await db.delete(users);
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function closeApp(app: FastifyInstance) {
  await app.close();
}

// Cookies de session renvoyés par une réponse de l'API
export function sessionCookies(response: { cookies: { name: string; value: string }[] }) {
  return Object.fromEntries(response.cookies.map((cookie) => [cookie.name, cookie.value]));
}

// Inscrit un joueur (email, pseudo, mot de passe) et retourne ses cookies de session
export async function createPlayer(app: FastifyInstance, name: string): Promise<TestPlayer> {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/sign-up/email",
    payload: { email: `${name}@test.local`, password: PASSWORD, name, username: name },
  });
  if (response.statusCode !== 200) {
    throw new Error(`Inscription de ${name} impossible : ${response.body}`);
  }
  return { id: response.json<{ user: { id: string } }>().user.id, cookies: sessionCookies(response) };
}

// En-tête Cookie équivalent, pour les sockets
export function cookieHeader(player: TestPlayer) {
  return Object.entries(player.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export const SENSITIVE_FIELDS = ["password", "email", "verifiedToken", "resetPasswordToken"];

// Liste les clés sensibles présentes à n'importe quelle profondeur
export function findSensitiveFields(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findSensitiveFields(item, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [
      ...(SENSITIVE_FIELDS.includes(key) ? [`${path}.${key}`] : []),
      ...findSensitiveFields(child, `${path}.${key}`),
    ]);
  }
  return [];
}

// Socket connecté avec la session du joueur
export function connectPlayer(url: string, player: TestPlayer): Socket {
  return connectClient(url, {
    transports: ["websocket"],
    reconnection: false,
    extraHeaders: { cookie: cookieHeader(player) },
  });
}

export function nextEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

// Données de partie enregistrées, toutes cartes visibles (l'API et les sockets masquent les cartes cachées)
export async function storedGameData(gameId: string): Promise<GameData> {
  const [game] = await db.select({ gameData: games.gameData }).from(games).where(eq(games.id, gameId));
  return game.gameData;
}
