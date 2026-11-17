import { opponentStats, playerStats, playsAgainst } from "@/game/stats";
import type { GameType } from "@/types/types";
import { describe, expect, it } from "vitest";

const game = (id: string, creator: string, winner: string | null, roundNumber: number, players: string[]) =>
  ({
    id,
    creator,
    winner,
    roundNumber,
    state: winner ? "finished" : "playing",
    createdAt: "2026-10-01",
    players: players.map((p) => ({ id: p, username: p.toLowerCase() })),
  }) as unknown as GameType;

const games = [
  game("g1", "ME", "ME", 3, ["ME", "BOB"]),
  game("g2", "BOB", "BOB", 5, ["ME", "BOB", "ZOE"]),
  game("g3", "ME", null, 1, ["ME", "ZOE"]),
];

describe("statistiques du joueur", () => {
  it("compte victoires, défaites, parties et manches", () => {
    expect(playerStats(games, "ME")).toEqual({
      victories: 1,
      defeats: 1,
      finishedGames: 2,
      createdGames: 2,
      victoryRate: 50,
      totalRounds: 9,
      maxRounds: 5,
    });
  });

  it("donne 0 % de victoires sans partie terminée", () => {
    expect(playerStats([], "ME").victoryRate).toBe(0);
  });
});

describe("statistiques par adversaire", () => {
  it("ne compte que les parties terminées, triées par nombre de parties", () => {
    expect(opponentStats(games, "ME")).toEqual([
      { id: "BOB", username: "bob", games: 2, victories: 1, defeats: 1, rounds: 8 },
      { id: "ZOE", username: "zoe", games: 1, victories: 0, defeats: 1, rounds: 5 },
    ]);
  });
});

describe("robots dans les statistiques", () => {
  const withBots = (id: string, winner: string, bot: { id: string; username: string; botLevel: string }) =>
    ({
      id,
      creator: "ME",
      winner,
      roundNumber: 4,
      state: "finished",
      createdAt: "2026-11-16",
      players: [
        { id: "ME", username: "me" },
        { ...bot, isBot: true },
      ],
    }) as unknown as GameType;
  const moyen = { id: "robot-moyen-1", username: "Robot moyen", botLevel: "moyen" };
  const moyen2 = { id: "robot-moyen-2", username: "Robot moyen 2", botLevel: "moyen" };
  const difficile = { id: "robot-difficile-1", username: "Robot difficile", botLevel: "difficile" };
  const botGames = [
    withBots("b1", "ME", moyen),
    withBots("b2", "robot-moyen-2", moyen2),
    withBots("b3", "robot-difficile-1", difficile),
  ];

  it("regroupe les robots d'un même niveau en un seul adversaire", () => {
    expect(opponentStats(botGames, "ME")).toEqual([
      { id: "robot-moyen", username: "Robot moyen", isBot: true, games: 2, victories: 1, defeats: 1, rounds: 8 },
      {
        id: "robot-difficile",
        username: "Robot difficile",
        isBot: true,
        games: 1,
        victories: 1,
        defeats: 0,
        rounds: 4,
      },
    ]);
  });

  it("compte une seule partie quand deux robots du même niveau y jouent", () => {
    const both = {
      ...withBots("b4", "robot-moyen-2", moyen),
      players: [
        { id: "ME", username: "me" },
        { ...moyen, isBot: true },
        { ...moyen2, isBot: true },
      ],
    } as unknown as GameType;
    expect(opponentStats([both], "ME")).toEqual([
      { id: "robot-moyen", username: "Robot moyen", isBot: true, games: 1, victories: 1, defeats: 0, rounds: 4 },
    ]);
  });

  it("compte les parties contre des robots dans les victoires et le taux", () => {
    expect(playerStats(botGames, "ME")).toMatchObject({ victories: 1, defeats: 2, finishedGames: 3, victoryRate: 33 });
  });

  it("filtre les parties contre tous les robots d'un niveau", () => {
    expect(botGames.filter((game) => playsAgainst(game, "robot-moyen")).map((game) => game.id)).toEqual(["b1", "b2"]);
    expect(botGames.filter((game) => playsAgainst(game, "robot-difficile")).map((game) => game.id)).toEqual(["b3"]);
  });

  it("filtre les parties contre un humain par son identifiant", () => {
    expect(games.filter((game) => playsAgainst(game, "ZOE")).map((game) => game.id)).toEqual(["g2", "g3"]);
  });
});
