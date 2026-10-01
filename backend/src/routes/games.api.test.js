import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeApp, createPlayer, findSensitiveFields, setupApp } from "../../test/helpers.js";

let app;
let alice;
let bob;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  bob = await createPlayer(app, "bob");
});

afterAll(async () => {
  await closeApp(app);
});

async function createGame(player) {
  const response = await app.inject({
    method: "POST",
    url: "/api/game",
    cookies: player.cookies,
    payload: { userId: player.id },
  });
  return response.json().gameId;
}

describe("parties", () => {
  it("crée une partie dont le créateur est le premier joueur", async () => {
    const gameId = await createGame(alice);

    const response = await app.inject({ method: "GET", url: `/api/game/${gameId}` });

    expect(response.statusCode).toBe(200);
    expect(response.json().players.map(player => player.id)).toEqual([alice.id]);
  });

  it("refuse la création sans être connecté", async () => {
    const response = await app.inject({ method: "POST", url: "/api/game", payload: { userId: alice.id } });

    expect(response.statusCode).toBe(401);
  });

  it("ajoute un joueur qui rejoint la partie", async () => {
    const gameId = await createGame(alice);

    const response = await app.inject({
      method: "PATCH",
      url: `/api/game/join/${gameId}`,
      cookies: bob.cookies,
      payload: { userId: bob.id },
    });

    expect(response.statusCode).toBe(200);
    const game = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json();
    expect(game.players.map(player => player.id).sort()).toEqual([alice.id, bob.id].sort());
  });
});

describe("aucune donnée sensible dans les réponses de partie", () => {
  let gameId;

  beforeAll(async () => {
    gameId = await createGame(alice);
    await app.inject({
      method: "PATCH",
      url: `/api/game/join/${gameId}`,
      cookies: bob.cookies,
      payload: { userId: bob.id },
    });
  });

  it.each([
    ["GET /api/game/:id", () => ({ method: "GET", url: `/api/game/${gameId}` })],
    ["GET /api/games", () => ({ method: "GET", url: "/api/games" })],
    ["PATCH /api/game/start/:id", () => ({
      method: "PATCH",
      url: `/api/game/start/${gameId}`,
      cookies: alice.cookies,
      payload: {},
    })],
    ["PATCH /api/game/join/:id (déjà membre, partie en cours)", () => ({
      method: "PATCH",
      url: `/api/game/join/${gameId}`,
      cookies: bob.cookies,
      payload: { userId: bob.id },
    })],
  ])("%s", async (_name, request) => {
    const response = await app.inject(request());

    expect(response.statusCode).toBe(200);
    expect(findSensitiveFields(response.json())).toEqual([]);
  });

  it("PATCH /api/game/join/:id (nouveau joueur)", async () => {
    const carol = await createPlayer(app, "carol");
    const otherGameId = await createGame(alice);

    const response = await app.inject({
      method: "PATCH",
      url: `/api/game/join/${otherGameId}`,
      cookies: carol.cookies,
      payload: { userId: carol.id },
    });

    expect(response.statusCode).toBe(200);
    expect(findSensitiveFields(response.json())).toEqual([]);
  });
});
