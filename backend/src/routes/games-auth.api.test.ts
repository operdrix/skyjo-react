import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { GameType } from "../../../shared/types.ts";
import { closeApp, type TestPlayer, createPlayer, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let alice: TestPlayer;
let bob: TestPlayer;
let carol: TestPlayer;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
  bob = await createPlayer(app, "bob");
  carol = await createPlayer(app, "carol");
});

afterAll(async () => {
  await closeApp(app);
});

async function createGame(player: TestPlayer, payload: object = {}) {
  return app.inject({ method: "POST", url: "/api/game", cookies: player.cookies, payload });
}

function act(action: string, gameId: string, player: TestPlayer, payload: object = {}) {
  return app.inject({ method: "PATCH", url: `/api/game/${action}/${gameId}`, cookies: player.cookies, payload });
}

async function getGame(gameId: string) {
  return (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();
}

const playerIds = (game: GameType) => game.players.map((player) => player.id).sort();

describe("identité prise dans le jeton, pas dans le body", () => {
  it("crée la partie au nom de l'utilisateur connecté, sans userId dans le body", async () => {
    const response = await createGame(alice);

    expect(response.statusCode).toBe(200);
    const game = await getGame(response.json<{ gameId: string }>().gameId);
    expect(game.creator).toBe(alice.id);
  });

  it("ignore le userId d'un autre joueur à la création", async () => {
    const response = await createGame(alice, { userId: bob.id });

    const game = await getGame(response.json<{ gameId: string }>().gameId);
    expect(game.creator).toBe(alice.id);
    expect(playerIds(game)).toEqual([alice.id]);
  });

  it("fait rejoindre l'utilisateur connecté, pas celui du body", async () => {
    const { gameId } = (await createGame(alice)).json<{ gameId: string }>();

    await act("join", gameId, bob, { userId: carol.id });

    expect(playerIds(await getGame(gameId))).toEqual([alice.id, bob.id].sort());
  });

  it("ne permet pas de faire quitter un autre joueur", async () => {
    const { gameId } = (await createGame(alice)).json<{ gameId: string }>();
    await act("join", gameId, bob);

    await act("leave", gameId, carol, { userId: bob.id });

    expect(playerIds(await getGame(gameId))).toEqual([alice.id, bob.id].sort());
  });
});

describe("actions réservées au créateur", () => {
  it("refuse le démarrage par un autre joueur que le créateur", async () => {
    const { gameId } = (await createGame(alice)).json<{ gameId: string }>();
    await act("join", gameId, bob);

    const response = await act("start", gameId, bob);

    expect(response.statusCode).toBe(403);
    expect((await getGame(gameId)).state).toBe("pending");
  });

  it("refuse la fin de partie déclarée par un autre joueur que le créateur", async () => {
    const { gameId } = (await createGame(alice)).json<{ gameId: string }>();
    await act("join", gameId, bob);
    await act("start", gameId, alice);

    const response = await act("finish", gameId, bob, { winner: bob.id, winnerScore: 1 });

    expect(response.statusCode).toBe(403);
    expect((await getGame(gameId)).state).toBe("playing");
  });

  it("refuse la modification des paramètres par un autre joueur que le créateur", async () => {
    const { gameId } = (await createGame(alice)).json<{ gameId: string }>();
    await act("join", gameId, bob);

    const response = await app.inject({
      method: "PATCH",
      url: `/api/game/${gameId}`,
      cookies: bob.cookies,
      payload: { maxPlayers: 2 },
    });

    expect(response.statusCode).toBe(403);
    expect((await getGame(gameId)).maxPlayers).toBe(4);
  });
});
