// Règles de Banco (stop ou encore) : module pur, sans accès base ni socket.
// Chaque fonction renvoie un nouvel état, sans modifier celui reçu.

import { randomUUID } from "node:crypto";
import type { BancoCard, BancoData, PublicBancoData } from "../../../../shared/types.ts";
import { shuffle, type Scores } from "../rules.ts";

export const TARGET_SCORE = 200;
// Nombres différents à réunir pour le bonus, qui termine aussitôt la manche
export const SEVEN = 7;
export const SEVEN_BONUS = 15;

// Paquet : nombres de 0 à 12 (n exemplaires de la carte n, un seul 0), modificateurs +2 à +10 et ×2
export function createDeck(): BancoCard[] {
  const cards: BancoCard[] = [{ id: randomUUID(), kind: "number", value: 0 }];
  for (let value = 1; value <= 12; value++) {
    for (let i = 0; i < value; i++) cards.push({ id: randomUUID(), kind: "number", value });
  }
  for (const value of [2, 4, 6, 8, 10]) cards.push({ id: randomUUID(), kind: "plus", value });
  cards.push({ id: randomUUID(), kind: "double" });
  return cards;
}

// Nouvelle manche : paquet mélangé, une carte à chaque joueur.
// Le premier joueur change à chaque manche (`round` commence à 1).
export function deal(playerIds: string[], round: number, random = Math.random): BancoData {
  const deck = shuffle(createDeck(), random);
  const shift = (round - 1) % playerIds.length;
  const turnOrder = [...playerIds.slice(shift), ...playerIds.slice(0, shift)];
  return {
    hands: Object.fromEntries(turnOrder.map((id) => [id, [deck.shift()!]])),
    status: Object.fromEntries(turnOrder.map((id) => [id, "playing"])),
    deck,
    turnOrder,
    currentPlayer: turnOrder[0],
    lastDraw: null,
    roundOver: false,
  };
}

const isTurnOf = (state: BancoData, playerId: string) =>
  !state.roundOver && state.currentPlayer === playerId && state.status[playerId] === "playing";

const numbers = (hand: BancoCard[]) => hand.flatMap((card) => (card.kind === "number" ? [card.value] : []));
const distinctValues = (hand: BancoCard[]) => new Set(numbers(hand)).size;

// Joueur suivant encore en jeu (lui-même s'il est le seul) ; sans joueur en jeu, la manche est finie
function passTurn(state: BancoData): BancoData {
  const start = state.turnOrder.indexOf(state.currentPlayer!);
  for (let step = 1; step <= state.turnOrder.length; step++) {
    const playerId = state.turnOrder[(start + step) % state.turnOrder.length];
    if (state.status[playerId] === "playing") return { ...state, currentPlayer: playerId };
  }
  return { ...state, currentPlayer: null, roundOver: true };
}

// Encore : le joueur prend la carte du dessus ; un nombre en double l'élimine, 7 nombres différents finissent la manche
export function hit(state: BancoData, playerId: string): BancoData | null {
  if (!isTurnOf(state, playerId) || !state.deck.length) return null;
  const [card, ...deck] = state.deck;
  const before = state.hands[playerId];
  const hand = [...before, card];
  const busted = card.kind === "number" && numbers(before).includes(card.value);
  const next: BancoData = {
    ...state,
    deck,
    hands: { ...state.hands, [playerId]: hand },
    status: busted ? { ...state.status, [playerId]: "busted" } : state.status,
    lastDraw: { playerId, card },
  };
  if (!busted && distinctValues(hand) >= SEVEN) {
    return { ...next, currentPlayer: null, roundOver: true };
  }
  return passTurn(next);
}

// Stop : le joueur garde ses points pour la manche
export function stay(state: BancoData, playerId: string): BancoData | null {
  if (!isTurnOf(state, playerId)) return null;
  return passTurn({ ...state, status: { ...state.status, [playerId]: "stopped" } });
}

// Joueur parti : il s'arrête avec ses points, et son tour passe s'il jouait
export function leave(state: BancoData, playerId: string): BancoData {
  if (state.roundOver || state.status[playerId] !== "playing") return state;
  const next: BancoData = { ...state, status: { ...state.status, [playerId]: "stopped" } };
  return state.currentPlayer === playerId ? passTurn(next) : next;
}

// Points d'une main : somme des nombres, doublée par le ×2, puis les modificateurs +, puis +15 pour 7 nombres différents
export function handScore(hand: BancoCard[]): number {
  const sum = numbers(hand).reduce((total, value) => total + value, 0);
  const doubled = hand.some((card) => card.kind === "double") ? sum * 2 : sum;
  const bonus = hand.reduce((total, card) => total + (card.kind === "plus" ? card.value : 0), 0);
  return doubled + bonus + (distinctValues(hand) >= SEVEN ? SEVEN_BONUS : 0);
}

// Points de la manche : 0 en cas de doublon
export function roundScores(state: BancoData): Scores {
  return Object.fromEntries(
    state.turnOrder.map((playerId) => [
      playerId,
      state.status[playerId] === "busted" ? 0 : handScore(state.hands[playerId]),
    ]),
  );
}

// Fin de partie dès qu'un joueur atteint 200 ; le plus haut total gagne
export function result(totals: Scores) {
  let winner: string | null = null;
  let winnerScore: number | null = null;
  for (const [playerId, score] of Object.entries(totals)) {
    if (winnerScore === null || score > winnerScore) {
      winner = playerId;
      winnerScore = score;
    }
  }
  return { finished: winnerScore !== null && winnerScore >= TARGET_SCORE, winner, winnerScore };
}

// Partie diffusée : la pioche n'est donnée que par son nombre de cartes
export function view({ deck, ...state }: BancoData): PublicBancoData {
  return { ...structuredClone(state), deckCount: deck.length };
}

// Remplace l'identifiant d'un joueur (invité devenu compte)
export function renamePlayer(state: BancoData, from: string, to: string): BancoData {
  const rename = (id: string) => (id === from ? to : id);
  const renameKeys = <T>(record: Record<string, T>) =>
    Object.fromEntries(Object.entries(record).map(([id, value]) => [rename(id), value]));
  return {
    ...state,
    hands: renameKeys(state.hands),
    status: renameKeys(state.status),
    turnOrder: state.turnOrder.map(rename),
    currentPlayer: state.currentPlayer && rename(state.currentPlayer),
    lastDraw: state.lastDraw && { ...state.lastDraw, playerId: rename(state.lastDraw.playerId) },
  };
}
