import type { FastifyInstance } from "fastify";
import { io as connectClient, type Socket } from "socket.io-client";
import { buildApp } from "../src/app.ts";
import { db } from "../src/db/index.ts";
import { gamePlayers, games, users } from "../src/db/schema.ts";

const PASSWORD = "secret-de-test";

export type TestPlayer = { id: string; cookies: Record<string, string> };

// App neuve sur une base vide (schéma créé par test/global-setup.ts)
export async function setupApp() {
  await db.delete(gamePlayers);
  await db.delete(games);
  await db.delete(users);
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function closeApp(app: FastifyInstance) {
  await app.close();
}

// Crée un compte vérifié et retourne ses cookies de session
export async function createPlayer(app: FastifyInstance, name: string): Promise<TestPlayer> {
  const user = {
    id: name.toUpperCase(),
    firstname: name,
    lastname: name,
    username: name,
    email: `${name}@test.local`,
    password: await app.bcrypt.hash(PASSWORD),
    verified: true,
  };
  await db.insert(users).values(user);

  const response = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { email: user.email, password: PASSWORD },
  });
  const cookies = Object.fromEntries(response.cookies.map(cookie => [cookie.name, cookie.value]));
  return { id: user.id, cookies };
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
    extraHeaders: { cookie: `accessToken=${player.cookies.accessToken}` },
  });
}

export function nextEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise(resolve => socket.once(event, resolve));
}
