import { describe, expect, it } from "vitest";
import type { GameData } from "../../../shared/types.ts";
import { renamePlayer } from "./players.ts";

const gameData = (): GameData => ({
  playersCards: { GUEST: [], ALICE: [] },
  deckCards: [],
  discardPile: [],
  currentPlayer: "GUEST",
  currentStep: "draw",
  turnOrder: ["ALICE", "GUEST"],
  lastTurn: true,
  firstPlayerToEnd: "GUEST",
});

describe("renamePlayer", () => {
  it("remplace l'identifiant du joueur partout dans les données de partie", () => {
    const renamed = renamePlayer(gameData(), "GUEST", "NEW");

    expect(Object.keys(renamed.playersCards).sort()).toEqual(["ALICE", "NEW"]);
    expect(renamed).toMatchObject({ currentPlayer: "NEW", turnOrder: ["ALICE", "NEW"], firstPlayerToEnd: "NEW" });
  });

  it("garde l'ordre des joueurs et ne touche pas aux autres", () => {
    const data = { ...gameData(), currentPlayer: "ALICE", firstPlayerToEnd: null };

    const renamed = renamePlayer(data, "GUEST", "NEW");

    expect(Object.keys(renamed.playersCards)).toEqual(["NEW", "ALICE"]);
    expect(renamed).toMatchObject({ currentPlayer: "ALICE", firstPlayerToEnd: null });
  });

  it("laisse telle quelle une partie pas encore distribuée", () => {
    expect(renamePlayer({} as GameData, "GUEST", "NEW")).toEqual({});
  });
});
