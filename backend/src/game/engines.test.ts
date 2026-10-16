import { describe, expect, it } from "vitest";
import type { BancoData } from "../../../shared/types.ts";
import { engineFor, GAME_KINDS } from "./engines.ts";

// Manche précédente de Banco dont la pioche ne contient que des nombres : distribution prévisible
const numbersOnly = {
  deck: [1, 2, 3, 4, 5, 6].map((value) => ({ id: `n${value}`, kind: "number", value })),
  discard: [],
  hands: {},
  pending: [],
} as unknown as BancoData;

describe("engineFor", () => {
  it("connaît le jeu colonnes", () => {
    expect(GAME_KINDS).toContain("colonnes");
    expect(engineFor("colonnes")).toBeDefined();
  });

  it("ne connaît pas un jeu inconnu", () => {
    expect(engineFor("inconnu")).toBeUndefined();
    expect(engineFor("toString")).toBeUndefined();
  });
});

describe("moteur colonnes", () => {
  const engine = engineFor("colonnes")!;

  it("se joue de 2 à 8 joueurs", () => {
    expect([engine.minPlayers, engine.maxPlayers]).toEqual([2, 8]);
  });

  it("distribue une manche et masque la pioche dans la vue", () => {
    const state = engine.deal(["a", "b"], 1);
    const view = engine.view(state);

    expect(Object.keys(state.playersCards)).toEqual(["a", "b"]);
    expect(engine.isRoundOver(state)).toBe(false);
    expect(view.deckCards.every((card: { value?: number }) => card.value === undefined)).toBe(true);
  });

  it("joue un coup et fait avancer la manche, ou refuse un coup impossible", () => {
    const state = engine.deal(["a", "b"], 1);
    const once = engine.play(state, "a", { move: "reveal", cardIndex: 0 })!;
    const twice = engine.play(once, "a", { move: "reveal", cardIndex: 1 })!;
    const after = engine.play(twice, "b", { move: "reveal", cardIndex: 0 })!;
    const started = engine.play(after, "b", { move: "reveal", cardIndex: 1 })!;

    expect(engine.play(state, "a", { move: "draw" })).toBeNull();
    expect(started.currentStep).toBe("draw");
  });

  it("termine la partie quand un joueur atteint 100, le plus petit total gagne", () => {
    expect(engine.result({ a: 100, b: 40 })).toEqual({ finished: true, winner: "b", winnerScore: 40 });
    expect(engine.result({ a: 90, b: 40 }).finished).toBe(false);
  });
});

describe("moteur banco", () => {
  const engine = engineFor("banco")!;

  it("est connu, se joue de 2 à 8 joueurs avec Encore, Stop et le choix d'une cible", () => {
    expect(GAME_KINDS).toContain("banco");
    expect([engine.minPlayers, engine.maxPlayers]).toEqual([2, 8]);
    expect(engine.moves).toEqual(["hit", "stay", "target"]);
  });

  it("applique la cible choisie pour une action", () => {
    const withFreeze = {
      ...numbersOnly,
      deck: [numbersOnly.deck[0], numbersOnly.deck[1], { id: "g", kind: "freeze" }],
    };
    const state = engine.play(engine.deal(["a", "b"], 1, withFreeze as BancoData), "a", { move: "hit" })!;

    expect(engine.play(state, "a", { move: "target" })).toBeNull();
    expect(engine.play(state, "a", { move: "target", target: "b" })!.status.b).toBe("stopped");
  });

  it("distribue selon la manche et joue les intentions", () => {
    const state = engine.deal(["a", "b"], 2, numbersOnly);

    expect(state.currentPlayer).toBe("b");
    expect(engine.play(state, "a", { move: "stay" })).toBeNull();
    expect(engine.play(state, "b", { move: "draw" })).toBeNull();
    expect(engine.play(state, "b", { move: "stay" })!.status.b).toBe("stopped");
    expect(engine.play(state, "b", { move: "hit" })!.hands.b).toHaveLength(2);
  });

  it("fait passer le tour d'un joueur parti", () => {
    const state = engine.deal(["a", "b"], 1, numbersOnly);

    expect(engine.leave(state, "a").currentPlayer).toBe("b");
  });

  it("finit la manche quand plus personne n'est en jeu", () => {
    const state = engine.deal(["a", "b"], 1, numbersOnly);
    const over = engine.play(engine.play(state, "a", { move: "stay" })!, "b", { move: "stay" })!;

    expect(engine.isRoundOver(over)).toBe(true);
    expect(engine.view(over)).not.toHaveProperty("deck");
  });
});

describe("moteur colonnes, départ d'un joueur", () => {
  it("ne change rien à la manche", () => {
    const engine = engineFor("colonnes")!;
    const state = engine.deal(["a", "b"], 1);

    expect(engine.leave(state, "a")).toBe(state);
  });
});
