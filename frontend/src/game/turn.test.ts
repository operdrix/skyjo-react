import { describe, expect, it } from "vitest";
import { isMyTurn, isRoundOver } from "@/game/turn";
import type { GameType } from "@/types/types";

const colonnes = (gameData: object) => ({ gameType: "colonnes", gameData }) as unknown as GameType;
const banco = (gameData: object) => ({ gameType: "banco", gameData }) as unknown as GameType;

describe("isRoundOver", () => {
  it("lit la fin de manche selon le jeu", () => {
    expect(isRoundOver(colonnes({ currentStep: "endGame" }))).toBe(true);
    expect(isRoundOver(colonnes({ currentStep: "draw" }))).toBe(false);
    expect(isRoundOver(banco({ roundOver: true }))).toBe(true);
    expect(isRoundOver(banco({ roundOver: false }))).toBe(false);
  });
});

describe("isMyTurn", () => {
  it("Colonnes : au joueur courant, au début de son tour", () => {
    expect(isMyTurn(colonnes({ currentPlayer: "A", currentStep: "draw" }), "A")).toBe(true);
    expect(isMyTurn(colonnes({ currentPlayer: "A", currentStep: "flip-deck" }), "A")).toBe(false);
    expect(isMyTurn(colonnes({ currentPlayer: "B", currentStep: "draw" }), "A")).toBe(false);
  });

  it("Banco : au joueur courant tant que la manche dure", () => {
    expect(isMyTurn(banco({ currentPlayer: "A", roundOver: false }), "A")).toBe(true);
    expect(isMyTurn(banco({ currentPlayer: "B", roundOver: false }), "A")).toBe(false);
    expect(isMyTurn(banco({ currentPlayer: null, roundOver: true }), "A")).toBe(false);
  });
});
