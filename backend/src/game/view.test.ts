import { describe, expect, it } from "vitest";
import type { Card, GameData } from "../../../shared/types.ts";
import { dealCards } from "./rules.ts";
import { hideCards } from "./view.ts";

const card = (id: string, value: number, revealed: boolean, onHand = false): Card => ({
  id,
  value,
  color: "green",
  revealed,
  onHand,
});

function game(partial: Partial<GameData>): GameData {
  return {
    playersCards: {},
    deckCards: [],
    discardPile: [],
    currentPlayer: null,
    currentStep: "draw",
    turnOrder: [],
    lastTurn: false,
    firstPlayerToEnd: null,
    ...partial,
  };
}

describe("cartes cachées", () => {
  it("retire valeur et couleur des cartes non révélées des joueurs", () => {
    const view = hideCards(game({ playersCards: { a: [card("x", 7, false), card("y", 3, true)] } }));

    expect(view.playersCards.a).toEqual([
      { id: "x", revealed: false, onHand: false },
      { id: "y", value: 3, color: "green", revealed: true, onHand: false },
    ]);
  });

  it("ne laisse dans la pioche que des cartes masquées, sauf la carte piochée en main", () => {
    const view = hideCards(game({ deckCards: [card("d", 12, true, true), card("e", -2, false), card("f", 5, false)] }));

    expect(view.deckCards).toEqual([
      { id: "d", value: 12, color: "green", revealed: true, onHand: true },
      { id: "e", revealed: false, onHand: false },
      { id: "f", revealed: false, onHand: false },
    ]);
  });

  it("montre la défausse", () => {
    const discardPile = [card("g", 4, true)];

    expect(hideCards(game({ discardPile })).discardPile).toEqual(discardPile);
  });

  it("montre toutes les cartes des joueurs en fin de manche", () => {
    const view = hideCards(game({ currentStep: "endGame", playersCards: { a: [card("x", 7, false)] } }));

    expect(view.playersCards.a).toEqual([{ id: "x", value: 7, color: "green", revealed: false, onHand: false }]);
  });

  it("laisse telle quelle une partie pas encore distribuée", () => {
    expect(hideCards({} as GameData)).toEqual({});
  });

  it("ne modifie pas la partie reçue", () => {
    const full = dealCards(["a", "b"]);
    const copy = structuredClone(full);

    hideCards(full);

    expect(full).toEqual(copy);
  });

  it("ne laisse aucune valeur cachée dans une partie distribuée", () => {
    const view = hideCards(dealCards(["a", "b"]));
    const hidden = [...Object.values(view.playersCards).flat(), ...view.deckCards];

    expect(hidden.every((shown) => !("value" in shown) && !("color" in shown))).toBe(true);
    expect(view.deckCards).toHaveLength(150 - 24 - 1);
  });
});
