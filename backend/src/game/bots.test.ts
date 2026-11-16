import { describe, expect, it } from "vitest";
import type { BotLevel, Card, GameData, GameStep } from "../../../shared/types.ts";
import { chooseIntent } from "./bots.ts";
import { applyIntent } from "./moves.ts";
import { advanceGame, dealCards } from "./rules.ts";
import { seededRandom, simulateGame } from "./simulation.ts";
import { hideCards } from "./view.ts";

// Main de 12 cartes à partir des valeurs ; `revealed` : indices révélés ou true pour toutes
function hand(values: number[], revealed: number[] | true = []): Card[] {
  return values.map((value, index) => ({
    id: `c${index}_${value}`,
    value,
    color: "green",
    onHand: false,
    revealed: revealed === true || revealed.includes(index),
  }));
}

const card = (value: number, revealed = true, onHand = false): Card => ({
  id: `x${value}_${revealed}`,
  value,
  color: "green",
  revealed,
  onHand,
});

// Partie au tour du robot, à l'étape donnée
function botTurn(step: GameStep, botCards: Card[], extra: Partial<GameData> = {}): GameData {
  return {
    playersCards: { bot: botCards, human: hand(Array(12).fill(5), [0, 1]) },
    deckCards: [card(6, false), card(7, false)],
    discardPile: [card(4)],
    currentPlayer: "bot",
    currentStep: step,
    turnOrder: ["human", "bot"],
    lastTurn: false,
    firstPlayerToEnd: null,
    ...extra,
  };
}

const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe("robot : quand il joue", () => {
  it("ne joue pas hors de son tour", () => {
    const gameData = botTurn("draw", hand(values, [0, 1]), { currentPlayer: "human" });
    expect(chooseIntent(hideCards(gameData), "bot", "facile")).toBeNull();
  });

  it("ne joue pas en fin de manche", () => {
    const gameData = botTurn("endGame", hand(values, true));
    expect(chooseIntent(hideCards(gameData), "bot", "facile")).toBeNull();
  });

  it("révèle une carte cachée pendant la révélation initiale, sans attendre son tour", () => {
    const gameData = botTurn("initialReveal", hand(values, [3]), { currentPlayer: null });
    const intent = chooseIntent(hideCards(gameData), "bot", "facile");
    expect(intent?.move).toBe("reveal");
    expect(gameData.playersCards.bot[intent!.cardIndex!].revealed).toBe(false);
  });

  it("ne révèle plus rien une fois ses 2 cartes révélées", () => {
    const gameData = botTurn("initialReveal", hand(values, [3, 7]), { currentPlayer: null });
    expect(chooseIntent(hideCards(gameData), "bot", "facile")).toBeNull();
  });
});

describe("robot : honnêteté", () => {
  it("joue le même coup quelle que soit la valeur des cartes cachées (les siennes et la pioche)", () => {
    for (const step of ["initialReveal", "draw", "decide-deck", "flip-deck", "replace-discard"] as GameStep[]) {
      const first = botTurn(step, hand(values, [0, 5]), { currentPlayer: step === "initialReveal" ? null : "bot" });
      const second = structuredClone(first);
      second.playersCards.bot.forEach((c, index) => !c.revealed && (c.value = 12 - (index % 3)));
      second.deckCards.forEach((c) => !c.revealed && (c.value = -2));
      if (step === "decide-deck") {
        first.deckCards[0] = card(6, true, true);
        second.deckCards[0] = card(6, true, true);
      }
      expect(chooseIntent(hideCards(first), "bot", "facile", seededRandom(7))).toEqual(
        chooseIntent(hideCards(second), "bot", "facile", seededRandom(7)),
      );
    }
  });
});

describe("robot Facile", () => {
  it("ne remplace jamais une carte visible par une carte plus forte", () => {
    const random = seededRandom(42);
    for (let i = 0; i < 500; i++) {
      const gameData = dealCards(["human", "bot"], random);
      const order = gameData.playersCards.bot.map((_, index) => index).sort(() => random() - 0.5);
      order.slice(0, Math.floor(random() * 12)).forEach((index) => (gameData.playersCards.bot[index].revealed = true));
      gameData.currentPlayer = "bot";
      const step = (["draw", "decide-deck", "replace-discard"] as const)[i % 3];
      gameData.currentStep = step;
      if (step === "decide-deck") Object.assign(gameData.deckCards[0], { revealed: true, onHand: true });
      if (step === "replace-discard") gameData.discardPile[0].onHand = true;
      const inHand = step === "decide-deck" ? gameData.deckCards[0].value : gameData.discardPile[0].value;

      const intent = chooseIntent(hideCards(gameData), "bot", "facile", random);

      expect(intent && applyIntent(gameData, "bot", intent)).toBeTruthy();
      if (intent?.move === "replace") {
        const target = gameData.playersCards.bot[intent.cardIndex!];
        if (target.revealed) expect(target.value).toBeGreaterThan(inHand);
      }
      if (intent?.move === "take-discard") {
        const cards = gameData.playersCards.bot;
        expect(cards.some((c) => !c.revealed || c.value > gameData.discardPile[0].value)).toBe(true);
      }
    }
  });

  it("joue des parties complètes à 2, 3 et 4 robots sans coup refusé", () => {
    const random = seededRandom(3);
    for (const count of [2, 3, 4]) {
      for (let i = 0; i < 10; i++) {
        const players = Array.from({ length: count }, (_, index) => ({ id: `p${index}`, level: "facile" as const }));
        const result = simulateGame(players, random);
        expect(Math.max(...Object.values(result.totals))).toBeGreaterThanOrEqual(100);
        expect(Object.keys(result.totals)).toHaveLength(count);
      }
    }
  });
});

describe("simulation", () => {
  it("reste reproductible avec un tirage fixé", () => {
    const players = [
      { id: "a", level: "facile" as const },
      { id: "b", level: "facile" as const },
    ];
    expect(simulateGame(players, seededRandom(11))).toEqual(simulateGame(players, seededRandom(11)));
  });

  it("joue chaque coup par l'intention, comme un joueur humain", () => {
    const random = seededRandom(5);
    let gameData = dealCards(["a", "b"], random);
    let moves = 0;
    while (gameData.currentStep !== "endGame" && moves < 2000) {
      const actor =
        gameData.currentPlayer ??
        (["a", "b"].find((id) => gameData.playersCards[id].filter((c) => c.revealed).length < 2) as string);
      const intent = chooseIntent(hideCards(gameData), actor, "facile", random);
      const next = applyIntent(gameData, actor, intent!);
      expect(next).not.toBeNull();
      gameData = advanceGame(next!);
      moves++;
    }
    expect(gameData.currentStep).toBe("endGame");
  });
});

// Taux de victoire de `level` contre `opponent` sur `games` parties en tête-à-tête, tirage fixé
// (chacun commence la liste des joueurs une partie sur deux)
function winRate(level: BotLevel, opponent: BotLevel, games: number, seed: number) {
  const random = seededRandom(seed);
  let wins = 0;
  for (let i = 0; i < games; i++) {
    const a = { id: "a", level };
    const b = { id: "b", level: opponent };
    if (simulateGame(i % 2 ? [a, b] : [b, a], random).winner === "a") wins++;
  }
  return wins / games;
}

describe("robot Moyen", () => {
  it("joue des parties complètes à 2, 3 et 4 robots sans coup refusé", () => {
    const random = seededRandom(8);
    for (const count of [2, 3, 4]) {
      for (let i = 0; i < 10; i++) {
        const players = Array.from({ length: count }, (_, index) => ({ id: `p${index}`, level: "moyen" as const }));
        expect(Object.keys(simulateGame(players, random).totals)).toHaveLength(count);
      }
    }
  });

  it("garde une carte piochée basse à la place de sa plus forte carte visible", () => {
    const gameData = botTurn("decide-deck", hand(values, [0, 11]));
    gameData.deckCards[0] = card(1, true, true);
    expect(chooseIntent(hideCards(gameData), "bot", "moyen")).toEqual({ move: "replace", cardIndex: 11 });
  });

  it("jette une carte piochée forte et retourne une carte cachée", () => {
    const gameData = botTurn("decide-deck", hand(values, [0, 1]));
    gameData.deckCards[0] = card(11, true, true);
    expect(chooseIntent(hideCards(gameData), "bot", "moyen")).toEqual({ move: "discard-drawn" });
  });

  it("banc d'essai : bat le Facile au moins 70 % du temps sur 200 parties", () => {
    expect(winRate("moyen", "facile", 200, 2026)).toBeGreaterThanOrEqual(0.7);
  });
});

describe("robot Difficile", () => {
  it("joue des parties complètes à 2, 3 et 4 robots sans coup refusé", () => {
    const random = seededRandom(9);
    for (const count of [2, 3, 4]) {
      for (let i = 0; i < 5; i++) {
        const players = Array.from({ length: count }, (_, index) => ({
          id: `p${index}`,
          level: (["difficile", "moyen", "facile"] as const)[index % 3],
        }));
        expect(Object.keys(simulateGame(players, random).totals)).toHaveLength(count);
      }
    }
  });

  it("complète une colonne quand la défausse le permet", () => {
    // Colonne 0 : indices 0, 4, 8 ; deux 7 visibles, un 10 visible
    const botCards = hand([7, 1, 2, 3, 7, 1, 2, 3, 10, 1, 2, 3], [0, 4, 8]);
    const drawStep = botTurn("draw", botCards, { discardPile: [card(7)] });
    expect(chooseIntent(hideCards(drawStep), "bot", "difficile")).toEqual({ move: "take-discard" });

    const replaceStep = botTurn("replace-discard", botCards, { discardPile: [card(7, true, true)] });
    expect(chooseIntent(hideCards(replaceStep), "bot", "difficile")).toEqual({ move: "replace", cardIndex: 8 });
  });

  it("ne retourne pas sa dernière carte cachée quand il n'a pas le plus petit score", () => {
    // Le robot a 11 cartes visibles (total élevé) et une seule cachée ; l'adversaire est loin devant
    const botCards = hand([9, 10, 11, 12, 9, 10, 11, 12, 9, 10, 11, 5], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const gameData = botTurn("decide-deck", botCards, {
      playersCards: { bot: botCards, human: hand([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], true) },
    });
    gameData.deckCards[0] = card(8, true, true);

    const intent = chooseIntent(hideCards(gameData), "bot", "difficile");

    expect(intent?.move).toBe("replace");
    expect(botCards[intent!.cardIndex!].revealed).toBe(true);
  });

  it("banc d'essai : bat le Moyen au moins 60 % du temps sur 200 parties", () => {
    expect(winRate("difficile", "moyen", 200, 2026)).toBeGreaterThanOrEqual(0.6);
  }, 60_000);
});
