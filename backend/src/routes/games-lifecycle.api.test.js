import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeApp, createPlayer, setupApp } from "../../test/helpers.js";

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

async function createGame(player, privateRoom = false) {
  const response = await app.inject({
    method: "POST",
    url: "/api/game",
    cookies: player.cookies,
    payload: { userId: player.id, privateRoom },
  });
  return response.json().gameId;
}

function act(action, gameId, player, payload = { userId: player.id }) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload });
}

async function getGame(gameId) {
  return (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json();
}

describe("forme d'une partie renvoyée par l'API", () => {
  it("expose joueurs (avec game_players), créateur et métadonnées", async () => {
    const gameId = await createGame(alice);
    await act("join", gameId, bob);

    const game = await getGame(gameId);

    expect(game).toMatchObject({
      id: gameId,
      state: "pending",
      private: false,
      creator: alice.id,
      roundNumber: 0,
      maxPlayers: 4,
      winner: null,
      winnerScore: null,
      playersPlayAgain: [],
      gameData: {},
      creatorPlayer: { id: alice.id, username: "alice" },
    });
    expect(typeof game.createdAt).toBe("string");
    expect(typeof game.updatedAt).toBe("string");
    const bobPlayer = game.players.find(player => player.id === bob.id);
    expect(bobPlayer).toEqual({
      id: bob.id,
      username: "bob",
      game_players: expect.objectContaining({
        gameId,
        userId: bob.id,
        status: "connected",
        score: 0,
        scoreByRound: [],
      }),
    });
  });

  it("renvoie 404 pour une partie inconnue", async () => {
    const response = await app.inject({ method: "GET", url: "/api/game/XXXXX" });

    expect(response.statusCode).toBe(404);
  });
});

describe("liste des parties", () => {
  it("filtre par état et visibilité", async () => {
    const publicId = await createGame(alice, false);
    const privateId = await createGame(alice, true);

    const games = (await app.inject({ method: "GET", url: "/api/games?state=pending&privateRoom=false" })).json();
    const ids = games.map(game => game.id);

    expect(ids).toContain(publicId);
    expect(ids).not.toContain(privateId);
    expect(games.every(game => game.state === "pending" && game.private === false)).toBe(true);
  });

  it("filtre les parties d'un joueur", async () => {
    const withBob = await createGame(alice);
    await act("join", withBob, bob);
    const withoutBob = await createGame(alice);

    const games = (await app.inject({ method: "GET", url: `/api/games?userId=${bob.id}` })).json();
    const ids = games.map(game => game.id);

    expect(ids).toContain(withBob);
    expect(ids).not.toContain(withoutBob);
  });

  it("liste les parties d'un utilisateur sans les données de jeu", async () => {
    const gameId = await createGame(bob);

    const response = await app.inject({ method: "GET", url: `/api/users/${bob.id}/games` });
    const game = response.json().find(game => game.id === gameId);

    expect(response.statusCode).toBe(200);
    expect(game.creatorPlayer).toEqual({ id: bob.id, username: "bob" });
    expect(game.players.map(player => player.id)).toEqual([bob.id]);
    expect(game).not.toHaveProperty("gameData");
  });
});

describe("paramètres et suppression", () => {
  it("modifie les paramètres tant que la partie est en attente", async () => {
    const gameId = await createGame(alice);

    const response = await app.inject({
      method: "PATCH", url: `/api/game/${gameId}`, cookies: alice.cookies, payload: { maxPlayers: 2, private: true },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ maxPlayers: 2, private: true });
  });

  it("refuse la modification d'une partie en cours", async () => {
    const gameId = await createGame(alice);
    await act("join", gameId, bob);
    await act("start", gameId, alice, {});

    const response = await app.inject({
      method: "PATCH", url: `/api/game/${gameId}`, cookies: alice.cookies, payload: { maxPlayers: 2 },
    });

    expect(response.statusCode).toBe(403);
  });

  it("seul le créateur peut supprimer la partie", async () => {
    const gameId = await createGame(alice);

    const byBob = await app.inject({ method: "DELETE", url: `/api/game/${gameId}`, cookies: bob.cookies });
    const byAlice = await app.inject({ method: "DELETE", url: `/api/game/${gameId}`, cookies: alice.cookies });
    const after = await app.inject({ method: "GET", url: `/api/game/${gameId}` });

    expect(byBob.statusCode).toBe(403);
    expect(byAlice.json()).toEqual({ gameDestroyed: true });
    expect(after.statusCode).toBe(404);
  });
});

describe("cycle de vie", () => {
  it("refuse un joueur de plus que le maximum", async () => {
    const gameId = await createGame(alice);
    await app.inject({ method: "PATCH", url: `/api/game/${gameId}`, cookies: alice.cookies, payload: { maxPlayers: 2 } });
    await act("join", gameId, bob);
    const carol = await createPlayer(app, "carol");

    const response = await act("join", gameId, carol);

    expect(response.json().error).toMatch(/complète/);
  });

  it("retire un joueur qui quitte une partie en attente", async () => {
    const gameId = await createGame(alice);
    await act("join", gameId, bob);

    await act("leave", gameId, bob);

    expect((await getGame(gameId)).players.map(player => player.id)).toEqual([alice.id]);
  });

  it("démarre la partie : distribution, manche 1", async () => {
    const gameId = await createGame(alice);
    await act("join", gameId, bob);

    const response = await act("start", gameId, alice, {});
    const game = response.json();

    expect(game.state).toBe("playing");
    expect(game.roundNumber).toBe(1);
    expect(game.gameData.currentStep).toBe("initialReveal");
    expect(Object.keys(game.gameData.playersCards).sort()).toEqual([alice.id, bob.id].sort());
  });

  it("marque déconnecté puis reconnecté un joueur d'une partie en cours", async () => {
    const gameId = await createGame(alice);
    await act("join", gameId, bob);
    await act("start", gameId, alice, {});

    await act("leave", gameId, bob);
    const left = await getGame(gameId);
    await act("join", gameId, bob);
    const back = await getGame(gameId);

    const status = (game) => game.players.find(player => player.id === bob.id).game_players.status;
    expect(left.players).toHaveLength(2);
    expect(status(left)).toBe("disconnected");
    expect(status(back)).toBe("connected");
  });

  it("termine la partie avec un gagnant, puis refuse toute action", async () => {
    const gameId = await createGame(alice);
    await act("join", gameId, bob);
    await act("start", gameId, alice, {});

    const missing = await act("finish", gameId, alice, {});
    const finished = await act("finish", gameId, alice, { winner: bob.id, winnerScore: 42 });
    const after = await act("join", gameId, bob);

    expect(missing.statusCode).toBe(400);
    expect(finished.json()).toMatchObject({ state: "finished", winner: bob.id, winnerScore: 42 });
    expect(after.statusCode).toBe(400);
  });
});
