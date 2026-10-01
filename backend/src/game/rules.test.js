import { describe, expect, it } from "vitest";
import {
  advanceGame,
  checkMaximumScore,
  computeRoundScores,
  createDeck,
  dealCards,
  shuffle,
} from "./rules.js";

// Main de 12 cartes à partir des valeurs ; `revealed` : indices révélés ou true pour toutes
function hand(values, revealed = []) {
  return values.map((value, index) => ({
    id: `c${index}_${value}`,
    value,
    revealed: revealed === true || revealed.includes(index),
  }));
}

const twelve = (value) => Array(12).fill(value);

describe("createDeck", () => {
  it("contient les 150 cartes du Skyjo", () => {
    const deck = createDeck();
    const count = (value) => deck.filter(card => card.value === value).length;

    expect(deck).toHaveLength(150);
    expect(count(-2)).toBe(5);
    expect(count(-1)).toBe(10);
    expect(count(0)).toBe(15);
    for (let value = 1; value <= 12; value++) {
      expect(count(value)).toBe(10);
    }
    expect(new Set(deck.map(card => card.id)).size).toBe(150);
    expect(deck.every(card => !card.revealed)).toBe(true);
  });
});

describe("shuffle", () => {
  it("retourne une permutation sans modifier l'original", () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(items);

    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect([...shuffled].sort()).toEqual(items);
  });
});

describe("dealCards", () => {
  it("donne 12 cartes à chaque joueur et révèle une carte sur la défausse", () => {
    const gameData = dealCards(["a", "b", "c"]);

    expect(Object.keys(gameData.playersCards)).toEqual(["a", "b", "c"]);
    for (const cards of Object.values(gameData.playersCards)) {
      expect(cards).toHaveLength(12);
      expect(cards.every(card => !card.revealed)).toBe(true);
    }
    expect(gameData.discardPile).toHaveLength(1);
    expect(gameData.discardPile[0].revealed).toBe(true);
    expect(gameData.deckCards).toHaveLength(150 - 36 - 1);
    expect([...gameData.turnOrder].sort()).toEqual(["a", "b", "c"]);
    expect(gameData.currentStep).toBe("initialReveal");
    expect(gameData.currentPlayer).toBeNull();
  });

  it("ne distribue jamais deux fois la même carte", () => {
    const gameData = dealCards(["a", "b"]);
    const ids = [
      ...Object.values(gameData.playersCards).flat(),
      ...gameData.deckCards,
      ...gameData.discardPile,
    ].map(card => card.id);

    expect(new Set(ids).size).toBe(150);
  });
});

describe("advanceGame : révélation initiale", () => {
  it("attend que tous les joueurs aient révélé 2 cartes", () => {
    const gameData = {
      currentStep: "initialReveal",
      currentPlayer: null,
      turnOrder: ["a", "b"],
      playersCards: { a: hand(twelve(1), [0, 1]), b: hand(twelve(1), [0]) },
    };

    advanceGame(gameData);

    expect(gameData.currentStep).toBe("initialReveal");
    expect(gameData.currentPlayer).toBeNull();
  });

  it("fait commencer le joueur dont les cartes révélées valent le plus", () => {
    const gameData = {
      currentStep: "initialReveal",
      currentPlayer: null,
      turnOrder: ["a", "b"],
      playersCards: {
        a: hand([3, 4, ...Array(10).fill(0)], [0, 1]),
        b: hand([5, 6, ...Array(10).fill(0)], [0, 1]),
      },
    };

    advanceGame(gameData);

    expect(gameData.currentStep).toBe("draw");
    expect(gameData.currentPlayer).toBe("b");
  });

  it("départage une égalité par la carte révélée la plus haute", () => {
    const gameData = {
      currentStep: "initialReveal",
      currentPlayer: null,
      turnOrder: ["a", "b"],
      playersCards: {
        a: hand([5, 5, ...Array(10).fill(0)], [0, 1]),
        b: hand([1, 9, ...Array(10).fill(0)], [0, 1]),
      },
    };

    advanceGame(gameData);

    expect(gameData.currentPlayer).toBe("b");
  });
});

describe("advanceGame : fin de tour", () => {
  function endTurn(playersCards, extra = {}) {
    return {
      currentStep: "endTurn",
      currentPlayer: "a",
      turnOrder: ["a", "b"],
      lastTurn: false,
      firstPlayerToEnd: null,
      discardPile: [],
      playersCards,
      ...extra,
    };
  }

  it("passe au joueur suivant tant qu'il reste des cartes cachées", () => {
    const gameData = endTurn({ a: hand(twelve(1), [0]), b: hand(twelve(1)) });

    advanceGame(gameData);

    expect(gameData.currentStep).toBe("draw");
    expect(gameData.currentPlayer).toBe("b");
    expect(gameData.lastTurn).toBe(false);
  });

  it("défausse une colonne de 3 cartes révélées identiques", () => {
    // colonnes : indices i, i+4, i+8 ; colonne 1 = indices 1, 5, 9
    const values = [1, 7, 2, 3, 4, 7, 5, 6, 8, 7, 9, 10];
    const gameData = endTurn({ a: hand(values, [1, 5, 9]), b: hand(twelve(1)) });

    advanceGame(gameData);

    expect(gameData.playersCards.a.map(card => card.value)).toEqual([1, 2, 3, 4, 5, 6, 8, 9, 10]);
    expect(gameData.discardPile.map(card => card.value)).toEqual([7, 7, 7]);
  });

  it("ne défausse pas une colonne si une carte est cachée", () => {
    const values = [1, 7, 2, 3, 4, 7, 5, 6, 8, 7, 9, 10];
    const gameData = endTurn({ a: hand(values, [1, 5]), b: hand(twelve(1)) });

    advanceGame(gameData);

    expect(gameData.playersCards.a).toHaveLength(12);
    expect(gameData.discardPile).toHaveLength(0);
  });

  it("déclenche le dernier tour quand un joueur a tout révélé", () => {
    const gameData = endTurn({ a: hand([...Array(11).fill(1), 2], true), b: hand(twelve(1)) });

    advanceGame(gameData);

    expect(gameData.lastTurn).toBe(true);
    expect(gameData.firstPlayerToEnd).toBe("a");
    expect(gameData.currentStep).toBe("draw");
    expect(gameData.currentPlayer).toBe("b");
  });

  it("révèle toutes les cartes du joueur qui joue son dernier tour et termine la manche", () => {
    const gameData = endTurn(
      { a: hand([...Array(11).fill(1), 2], true), b: hand([...Array(11).fill(2), 3], [0]) },
      { currentPlayer: "b", lastTurn: true, firstPlayerToEnd: "a" },
    );

    advanceGame(gameData);

    expect(gameData.playersCards.b.every(card => card.revealed)).toBe(true);
    expect(gameData.currentStep).toBe("endGame");
    expect(gameData.firstPlayerToEnd).toBe("a");
  });
});

describe("computeRoundScores", () => {
  it("additionne les cartes de chaque joueur", () => {
    const scores = computeRoundScores({
      firstPlayerToEnd: "a",
      playersCards: { a: hand([1, 2, -2]), b: hand([5, 5, 5]) },
    });

    expect(scores).toEqual({ a: 1, b: 15 });
  });

  it("double le score de celui qui termine sans avoir le plus petit score", () => {
    const scores = computeRoundScores({
      firstPlayerToEnd: "a",
      playersCards: { a: hand([5, 5]), b: hand([1, 1]) },
    });

    expect(scores).toEqual({ a: 20, b: 2 });
  });

  it("double aussi en cas d'égalité avec le plus petit score", () => {
    const scores = computeRoundScores({
      firstPlayerToEnd: "a",
      playersCards: { a: hand([3]), b: hand([3]) },
    });

    expect(scores).toEqual({ a: 6, b: 3 });
  });
});

describe("checkMaximumScore", () => {
  it("continue tant que personne n'atteint 100", () => {
    expect(checkMaximumScore({ a: 40, b: 99 }).finished).toBe(false);
  });

  it("termine la partie et désigne le plus petit total", () => {
    expect(checkMaximumScore({ a: 100, b: 42, c: 60 })).toEqual({
      finished: true,
      winner: "b",
      winnerScore: 42,
    });
  });

  it("désigne le gagnant même si son total est de 0", () => {
    expect(checkMaximumScore({ a: 0, b: 120, c: 50 })).toEqual({
      finished: true,
      winner: "a",
      winnerScore: 0,
    });
  });

  it("désigne le gagnant avec un total négatif", () => {
    expect(checkMaximumScore({ a: 105, b: -3 }).winner).toBe("b");
  });
});
