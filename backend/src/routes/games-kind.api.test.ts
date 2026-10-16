import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { GameKind, GameType } from "../../../shared/types.ts";
import { db } from "../db/index.ts";
import { games } from "../db/schema.ts";
import { closeApp, type TestPlayer, createPlayer, setupApp } from "../../test/helpers.ts";

let app: FastifyInstance;
let alice: TestPlayer;

beforeAll(async () => {
  app = await setupApp();
  alice = await createPlayer(app, "alice");
});

afterAll(async () => {
  await closeApp(app);
});

function create(payload: object) {
  return app.inject({ method: "POST", url: "/api/game", cookies: alice.cookies, payload });
}

async function createGame(payload: object = {}) {
  return (await create(payload)).json<{ gameId: string }>().gameId;
}

// Partie d'un autre jeu, posée en base (seul colonnes existe pour l'instant)
async function otherKindGame() {
  const gameId = await createGame();
  await db
    .update(games)
    .set({ gameType: "autre" as GameKind })
    .where(eq(games.id, gameId));
  return gameId;
}

const ids = (list: GameType[]) => list.map((game) => game.id);

describe("type de jeu des parties", () => {
  it("crée une partie de colonnes par défaut", async () => {
    const gameId = await createGame();

    const game = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();

    expect(game.gameType).toBe("colonnes");
  });

  it("crée une partie du type demandé", async () => {
    const gameId = await createGame({ type: "colonnes" });

    const game = (await app.inject({ method: "GET", url: `/api/game/${gameId}` })).json<GameType>();

    expect(game.gameType).toBe("colonnes");
  });

  it("refuse un type de jeu inconnu", async () => {
    const response = await create({ type: "inconnu" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "Ce jeu n'existe pas." });
  });

  it("filtre la liste des parties par type", async () => {
    const colonnes = await createGame();
    const other = await otherKindGame();

    const list = (await app.inject({ method: "GET", url: "/api/games?type=colonnes" })).json<GameType[]>();

    expect(ids(list)).toContain(colonnes);
    expect(ids(list)).not.toContain(other);
  });

  it("filtre l'historique d'un joueur par type", async () => {
    const colonnes = await createGame();
    const other = await otherKindGame();

    const history = (
      await app.inject({ method: "GET", url: `/api/users/${alice.id}/games?type=colonnes`, cookies: alice.cookies })
    ).json<GameType[]>();

    expect(ids(history)).toContain(colonnes);
    expect(ids(history)).not.toContain(other);
  });
});
