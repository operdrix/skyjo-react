import {
  applyIntent,
  discardDrawnCard,
  drawFromDeck,
  flipCard,
  replaceWithDiscard,
  replaceWithDrawn,
  revealInitialCard,
  takeDiscard,
} from "./moves.ts";
import type { Card, GameData } from "../../../shared/types.ts";
import { describe, expect, it } from "vitest";

const card = (id: string, value: number, revealed = false): Card => ({
  id,
  value,
  color: "green",
  revealed,
  onHand: false,
});

function gameData(step: GameData["currentStep"]): GameData {
  return {
    currentStep: step,
    currentPlayer: "ALICE",
    turnOrder: ["ALICE", "BOB"],
    lastTurn: false,
    firstPlayerToEnd: null,
    deckCards: [card("d1", 7), card("d2", 3)],
    discardPile: [card("x1", 1, true), card("x2", 9, true)],
    playersCards: { ALICE: [card("a1", 5), card("a2", 11)], BOB: [card("b1", 2)] },
  } as GameData;
}

const topOfDiscard = (data: GameData) => data.discardPile[data.discardPile.length - 1];

// Chaque coup renvoie de nouvelles données sans toucher aux données reçues
function expectUntouched(before: GameData, original: GameData) {
  expect(original).toEqual(before);
}

describe("coups du joueur", () => {
  it("pioche : révèle la carte du dessus de la pioche, en main", () => {
    const data = gameData("draw");
    const before = structuredClone(data);

    const next = drawFromDeck(data);

    expect(next.deckCards[0]).toMatchObject({ id: "d1", revealed: true, onHand: true });
    expect(next.currentStep).toBe("decide-deck");
    expectUntouched(before, data);
  });

  it("prend la carte du dessus de la défausse en main", () => {
    const data = gameData("draw");
    const before = structuredClone(data);

    const next = takeDiscard(data);

    expect(topOfDiscard(next)).toMatchObject({ id: "x2", onHand: true });
    expect(next.currentStep).toBe("replace-discard");
    expectUntouched(before, data);
  });

  it("défausse la carte piochée puis doit retourner une carte", () => {
    const data = drawFromDeck(gameData("draw"));
    const before = structuredClone(data);

    const next = discardDrawnCard(data);

    expect(next.deckCards.map((c) => c.id)).toEqual(["d2"]);
    expect(topOfDiscard(next)).toMatchObject({ id: "d1", onHand: false });
    expect(next.currentStep).toBe("flip-deck");
    expectUntouched(before, data);
  });

  it("échange une carte du jeu avec la carte de la défausse", () => {
    const data = takeDiscard(gameData("draw"));
    const before = structuredClone(data);

    const next = replaceWithDiscard(data, "ALICE", 1);

    expect(next.playersCards.ALICE[1]).toMatchObject({ id: "x2", onHand: false });
    expect(topOfDiscard(next)).toMatchObject({ id: "a2", revealed: true, onHand: false });
    expect(next.currentStep).toBe("endTurn");
    expectUntouched(before, data);
  });

  it("échange une carte du jeu avec la carte piochée", () => {
    const data = drawFromDeck(gameData("draw"));
    const before = structuredClone(data);

    const next = replaceWithDrawn(data, "ALICE", 0);

    expect(next.playersCards.ALICE[0]).toMatchObject({ id: "d1", onHand: false });
    expect(topOfDiscard(next)).toMatchObject({ id: "a1", revealed: true });
    expect(next.deckCards.map((c) => c.id)).toEqual(["d2"]);
    expect(next.currentStep).toBe("endTurn");
    expectUntouched(before, data);
  });

  it("retourne une carte du jeu après avoir défaussé la carte piochée", () => {
    const data = gameData("flip-deck");
    const before = structuredClone(data);

    const next = flipCard(data, "ALICE", 1);

    expect(next.playersCards.ALICE[1].revealed).toBe(true);
    expect(next.currentStep).toBe("endTurn");
    expectUntouched(before, data);
  });

  it("révèle une carte pendant la phase initiale, deux au maximum", () => {
    const data = gameData("initialReveal");
    const before = structuredClone(data);

    const once = revealInitialCard(data, "ALICE", 0);
    const twice = revealInitialCard(once, "ALICE", 1);
    const third = revealInitialCard(
      { ...twice, playersCards: { ...twice.playersCards, ALICE: [...twice.playersCards.ALICE, card("a3", 4)] } },
      "ALICE",
      2,
    );

    expect(twice.playersCards.ALICE.every((c) => c.revealed)).toBe(true);
    expect(third.playersCards.ALICE[2].revealed).toBe(false);
    expect(twice.currentStep).toBe("initialReveal");
    expectUntouched(before, data);
  });
});

describe("coup joué par intention", () => {
  const hidden = (step: GameData["currentStep"]) => gameData(step);

  it.each([
    ["draw", "draw", "decide-deck"],
    ["take-discard", "draw", "replace-discard"],
    ["discard-drawn", "decide-deck", "flip-deck"],
  ] as const)("applique « %s » pendant l'étape %s", (move, step, next) => {
    expect(applyIntent(hidden(step), "ALICE", { move })?.currentStep).toBe(next);
  });

  it("échange avec la défausse ou avec la carte piochée selon l'étape", () => {
    const fromDiscard = applyIntent(hidden("replace-discard"), "ALICE", { move: "replace", cardIndex: 1 })!;
    expect(fromDiscard.playersCards.ALICE[1].id).toBe("x2");

    const fromDeck = applyIntent(hidden("decide-deck"), "ALICE", { move: "replace", cardIndex: 1 })!;
    expect(fromDeck.playersCards.ALICE[1].id).toBe("d1");
  });

  it("retourne une carte cachée après avoir défaussé la carte piochée", () => {
    expect(
      applyIntent(hidden("flip-deck"), "ALICE", { move: "flip", cardIndex: 0 })!.playersCards.ALICE[0].revealed,
    ).toBe(true);
  });

  it.each([
    ["draw", "decide-deck", undefined],
    ["take-discard", "flip-deck", undefined],
    ["discard-drawn", "draw", undefined],
    ["replace", "draw", 0],
    ["replace", "flip-deck", 0],
    ["flip", "decide-deck", 0],
    ["reveal", "draw", 0],
  ] as const)("refuse « %s » pendant l'étape %s", (move, step, cardIndex) => {
    expect(applyIntent(hidden(step), "ALICE", { move, cardIndex })).toBeNull();
  });

  it("refuse un coup hors de son tour", () => {
    expect(applyIntent(hidden("draw"), "BOB", { move: "draw" })).toBeNull();
  });

  it.each([undefined, -1, 2, 1.5])("refuse un index de carte invalide (%s)", (cardIndex) => {
    expect(applyIntent(hidden("replace-discard"), "ALICE", { move: "replace", cardIndex })).toBeNull();
  });

  it("refuse de retourner une carte déjà visible", () => {
    const data = hidden("flip-deck");
    data.playersCards.ALICE[0].revealed = true;
    expect(applyIntent(data, "ALICE", { move: "flip", cardIndex: 0 })).toBeNull();
  });

  it("révèle une carte initiale sans attendre son tour, deux au maximum", () => {
    const data = { ...hidden("initialReveal"), currentPlayer: null };
    data.playersCards.ALICE.push(card("a3", 4));

    const once = applyIntent(data, "BOB", { move: "reveal", cardIndex: 0 })!;
    expect(once.playersCards.BOB[0].revealed).toBe(true);

    const twice = applyIntent(applyIntent(data, "ALICE", { move: "reveal", cardIndex: 0 })!, "ALICE", {
      move: "reveal",
      cardIndex: 1,
    })!;
    expect(applyIntent(twice, "ALICE", { move: "reveal", cardIndex: 2 })).toBeNull();
    expect(applyIntent(twice, "ALICE", { move: "reveal", cardIndex: 0 })).toBeNull();
  });

  it("ne modifie pas la partie reçue", () => {
    const data = hidden("draw");
    applyIntent(data, "ALICE", { move: "draw" });
    expect(data).toEqual(hidden("draw"));
  });
});
