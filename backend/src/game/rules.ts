// Règles du Skyjo : module pur, sans accès base ni socket.

import { randomUUID } from "node:crypto";
import type { Card, CardColor, GameData } from "../../../shared/types.ts";

export type Scores = Record<string, number>;

export const CARDS_PER_PLAYER = 12;
export const MAXIMUM_SCORE = 100;

// Set de cartes du skyjo (5 cartes -2, 10 cartes -1, 15 cartes 0 et 10 cartes de chaque de 1 à 12)
export function createDeck(): Card[] {
  const cards: Card[] = [];
  const addCards = (value: number, count: number, color: CardColor) => {
    for (let i = 0; i < count; i++) {
      cards.push({ id: randomUUID(), value, color, revealed: false, onHand: false });
    }
  };

  addCards(-2, 5, "negative");
  addCards(-1, 10, "negative");
  addCards(0, 15, "zero");
  for (let value = 1; value <= 12; value++) {
    const color = value <= 4 ? "green" : value <= 8 ? "yellow" : "red";
    addCards(value, 10, color);
  }
  return cards;
}

// Mélange de Fisher-Yates, `random` injectable pour les tests
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Distribue 12 cartes par joueur et retourne la première carte de la pioche sur la défausse
export function dealCards(playerIds: string[], random = Math.random): GameData {
  const cards = shuffle(createDeck(), random);

  const playersCards: Record<string, Card[]> = {};
  for (const playerId of playerIds) {
    playersCards[playerId] = cards.splice(-CARDS_PER_PLAYER).reverse();
  }

  const firstCard = cards.pop()!;
  firstCard.revealed = true;

  return {
    playersCards,
    deckCards: cards,
    discardPile: [firstCard],
    currentPlayer: null,
    currentStep: "initialReveal", // draw, decide, replace, flip, endTurn, endGame
    turnOrder: shuffle(playerIds, random),
    lastTurn: false,
    firstPlayerToEnd: null,
  };
}

// Fait avancer la manche après un coup (modifie gameData) :
// - initialReveal : passe à "draw" quand tous les joueurs ont révélé 2 cartes
// - endTurn : colonnes, dernier tour, fin de manche ou joueur suivant
export function advanceGame(gameData: GameData): GameData {
  if (gameData.currentStep === "initialReveal") {
    checkAllPlayersHaveTwoRevealed(gameData);
  }

  if (gameData.currentStep === "endTurn") {
    checkColumn(gameData);

    checkLastTurn(gameData);

    if (gameData.lastTurn) {
      revealAllCards(gameData, gameData.currentPlayer!);
      checkColumn(gameData);
    }

    checkEndGame(gameData);
  }

  return gameData;
}

export function countPoints(cards: Card[]): number {
  return cards.reduce((total, card) => total + card.value, 0);
}

// Score de la manche par joueur. Le joueur qui a terminé en premier voit son score doublé
// s'il n'a pas strictement le plus petit score.
export function computeRoundScores(gameData: GameData): Scores {
  const scores: Scores = {};
  for (const [playerId, cards] of Object.entries(gameData.playersCards)) {
    scores[playerId] = countPoints(cards);
  }

  const firstPlayerToEnd = gameData.firstPlayerToEnd;
  if (firstPlayerToEnd !== null && firstPlayerToEnd in scores) {
    const otherScores = Object.entries(scores)
      .filter(([playerId]) => playerId !== String(firstPlayerToEnd))
      .map(([, score]) => score);
    if (scores[firstPlayerToEnd] >= Math.min(...otherScores)) {
      scores[firstPlayerToEnd] *= 2;
    }
  }

  return scores;
}

// Fin de partie si un joueur atteint le score maximum ; le gagnant a le plus petit total.
// `totals` : { [playerId]: scoreTotal }
export function checkMaximumScore(totals: Scores) {
  let finished = false;
  let winnerScore: number | null = null;
  let winner: string | null = null;

  for (const [playerId, score] of Object.entries(totals)) {
    if (score >= MAXIMUM_SCORE) {
      finished = true;
    }
    if (winnerScore === null || score < winnerScore) {
      winnerScore = score;
      winner = playerId;
    }
  }

  return { finished, winner, winnerScore };
}

function revealAllCards(gameData: GameData, playerId: string) {
  for (const card of gameData.playersCards[playerId]) {
    card.revealed = true;
  }
}

function countUnrevealedCards(cards: Card[]) {
  return cards.reduce((count, card) => count + (card.revealed ? 0 : 1), 0);
}

// Fin de manche si tous les joueurs ont révélé toutes leurs cartes, sinon joueur suivant
function checkEndGame(gameData: GameData) {
  for (const playerId of gameData.turnOrder) {
    if (countUnrevealedCards(gameData.playersCards[playerId]) > 0) {
      nextPlayer(gameData);
      gameData.currentStep = "draw";
      return;
    }
  }
  gameData.currentStep = "endGame";
}

// Dernier tour dès qu'un joueur n'a plus de cartes non révélées
function checkLastTurn(gameData: GameData) {
  for (const playerId of gameData.turnOrder) {
    if (countUnrevealedCards(gameData.playersCards[playerId]) === 0) {
      gameData.lastTurn = true;
      gameData.firstPlayerToEnd = gameData.firstPlayerToEnd === null ? playerId : gameData.firstPlayerToEnd;
      return;
    }
  }
  gameData.lastTurn = false;
}

// Une colonne de 3 cartes révélées identiques part à la défausse
function checkColumn(gameData: GameData) {
  for (const cards of Object.values(gameData.playersCards)) {
    const offset = cards.length / 3;
    for (let i = 0; i < offset; i++) {
      const card1 = cards[i];
      const card2 = cards[i + offset];
      const card3 = cards[i + offset * 2];

      if (card1.revealed && card2.revealed && card3.revealed) {
        if (card1.value === card2.value && card2.value === card3.value) {
          gameData.discardPile.push(card1, card2, card3);

          cards.splice(i, 1);
          cards.splice(i + offset - 1, 1);
          cards.splice(i + offset * 2 - 2, 1);
          return;
        }
      }
    }
  }
}

function checkAllPlayersHaveTwoRevealed(gameData: GameData) {
  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId] || [];
    const revealedCount = cards.reduce((count, card) => count + (card.revealed ? 1 : 0), 0);
    if (revealedCount < 2) {
      return;
    }
  }

  gameData.currentStep = "draw";
  determineFirstPlayer(gameData);
}

function nextPlayer(gameData: GameData) {
  const currentUserIndex = gameData.turnOrder.indexOf(gameData.currentPlayer!);
  const nextPlayerIndex = (currentUserIndex + 1) % gameData.turnOrder.length;
  gameData.currentPlayer = gameData.turnOrder[nextPlayerIndex];
}

// Le joueur dont les cartes révélées valent le plus commence.
// En cas d'égalité, celui qui a la carte révélée la plus haute.
function determineFirstPlayer(gameData: GameData) {
  let highestValue = -10;
  let highestPlayer: string | null = null;

  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId].filter((card) => card.revealed);
    const totalValue = countPoints(cards);

    if (totalValue > highestValue) {
      highestValue = totalValue;
      highestPlayer = playerId;
    } else if (totalValue === highestValue) {
      const highestCard = Math.max(...cards.map((card) => card.value));
      const playerCards = gameData.playersCards[highestPlayer!].filter((card) => card.revealed);
      const highestPlayerCard = Math.max(...playerCards.map((card) => card.value));

      if (highestCard > highestPlayerCard) {
        highestPlayer = playerId;
      }
    }
  }
  gameData.currentPlayer = highestPlayer;
}
