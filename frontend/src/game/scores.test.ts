import { describe, expect, it } from "vitest";
import { formatPoints, formatScore, rankPlayers } from "@/game/scores";

const player = (id: string, scoreByRound: number[]) => ({
  id,
  username: id.toLowerCase(),
  game_players: { score: scoreByRound.reduce((a, b) => a + b, 0), scoreByRound },
});

describe("rankPlayers", () => {
  it("classe du plus petit total au plus grand, avec les points de la dernière manche", () => {
    const ranking = rankPlayers([player("BOB", [20, 30]), player("ALICE", [12, -4]), player("CARL", [5, 40])]);
    expect(ranking.map((r) => [r.rank, r.id, r.total, r.lastRound])).toEqual([
      [1, "ALICE", 8, -4],
      [2, "CARL", 45, 40],
      [3, "BOB", 50, 30],
    ]);
  });

  it("donne le même rang aux ex aequo", () => {
    const ranking = rankPlayers([player("ALICE", [10]), player("BOB", [10]), player("CARL", [15])]);
    expect(ranking.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("garde le détail des manches", () => {
    const [first] = rankPlayers([player("ALICE", [3, 7, 1])]);
    expect(first.rounds).toEqual([3, 7, 1]);
    expect(first.username).toBe("alice");
  });

  it("supporte un joueur sans manche jouée", () => {
    const [first] = rankPlayers([player("ALICE", [])]);
    expect(first).toMatchObject({ rank: 1, total: 0, lastRound: null, rounds: [] });
  });
});

describe("formatScore / formatPoints", () => {
  it("écrit les négatifs avec un vrai signe moins et signe les points d'une manche", () => {
    expect([formatScore(-4), formatScore(0), formatScore(12)]).toEqual(["−4", "0", "12"]);
    expect([formatPoints(-4), formatPoints(0), formatPoints(12)]).toEqual(["−4", "+0", "+12"]);
  });
});
