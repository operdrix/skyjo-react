// Règles de Banco (stop ou encore) : module pur, sans accès base ni socket.
// Chaque fonction renvoie un nouvel état, sans modifier celui reçu.

import { randomUUID } from "node:crypto";
import type { BancoAction, BancoCard, BancoData, PublicBancoData } from "../../../../shared/types.ts";
import { shuffle, type Scores } from "../rules.ts";

export const TARGET_SCORE = 200;
// Nombres différents à réunir pour le bonus, qui termine aussitôt la manche
export const SEVEN = 7;
export const SEVEN_BONUS = 15;
// Cartes tirées par la cible d'un Trois d'un coup
const THREE = 3;
const ACTIONS: BancoAction[] = ["freeze", "three", "second"];

// Paquet de 94 cartes : nombres de 0 à 12 (n exemplaires de la carte n, un seul 0),
// modificateurs +2 à +10 et ×2, 3 exemplaires de chaque action
export function createDeck(): BancoCard[] {
  const cards: BancoCard[] = [{ id: randomUUID(), kind: "number", value: 0 }];
  for (let value = 1; value <= 12; value++) {
    for (let i = 0; i < value; i++) cards.push({ id: randomUUID(), kind: "number", value });
  }
  for (const value of [2, 4, 6, 8, 10]) cards.push({ id: randomUUID(), kind: "plus", value });
  cards.push({ id: randomUUID(), kind: "double" });
  for (const kind of ACTIONS) {
    for (let i = 0; i < 3; i++) cards.push({ id: randomUUID(), kind });
  }
  return cards;
}

const isAction = (card: BancoCard): card is { id: string; kind: BancoAction } =>
  (ACTIONS as string[]).includes(card.kind);
const numbers = (hand: BancoCard[]) => hand.flatMap((card) => (card.kind === "number" ? [card.value] : []));
const distinctValues = (hand: BancoCard[]) => new Set(numbers(hand)).size;
const hasSecond = (hand: BancoCard[]) => hand.some((card) => card.kind === "second");

// Carte du dessus ; une pioche vide est reformée avec la défausse mélangée. null s'il ne reste aucune carte
function draw(state: BancoData, random = Math.random): [BancoCard, BancoData] | null {
  const deck = state.deck.length ? state.deck : shuffle(state.discard, random);
  if (!deck.length) return null;
  const [card, ...rest] = deck;
  return [card, { ...state, deck: rest, discard: state.deck.length ? state.discard : [] }];
}

const give = (state: BancoData, playerId: string, card: BancoCard): BancoData => ({
  ...state,
  hands: { ...state.hands, [playerId]: [...state.hands[playerId], card] },
});

const toDiscard = (state: BancoData, ...cards: BancoCard[]): BancoData => ({
  ...state,
  discard: [...state.discard, ...cards],
});

// Fin de manche : les actions en attente sont défaussées
const endRound = (state: BancoData): BancoData =>
  toDiscard({ ...state, pending: [], currentPlayer: null, roundOver: true }, ...state.pending.map((p) => p.card));

// Nombre ou modificateur reçu : un nombre en double élimine, sauf Seconde chance (les deux cartes sont défaussées) ;
// 7 nombres différents finissent la manche
function receive(state: BancoData, playerId: string, card: BancoCard): BancoData {
  const hand = state.hands[playerId];
  const lastDraw = { playerId, card };
  if (card.kind === "number" && numbers(hand).includes(card.value)) {
    if (hasSecond(hand)) {
      const used = hand.find((other) => other.kind === "second")!;
      const kept = { ...state, hands: { ...state.hands, [playerId]: hand.filter((other) => other !== used) } };
      return { ...toDiscard(kept, used, card), lastDraw: { ...lastDraw, saved: true } };
    }
    return { ...give(state, playerId, card), status: { ...state.status, [playerId]: "busted" }, lastDraw };
  }
  const next = { ...give(state, playerId, card), lastDraw };
  return distinctValues(next.hands[playerId]) >= SEVEN ? endRound(next) : next;
}

// Action tirée : une Seconde chance est gardée par qui n'en a pas ; le reste attend une cible
function drawAction(state: BancoData, playerId: string, card: BancoCard): BancoData {
  const lastDraw = { playerId, card };
  if (card.kind === "second" && !hasSecond(state.hands[playerId])) return { ...give(state, playerId, card), lastDraw };
  return { ...state, pending: [...state.pending, { playerId, card }], lastDraw };
}

// Cibles possibles de la première action en attente : joueurs en jeu, joueur compris ;
// une Seconde chance se donne à un autre joueur en jeu qui n'en a pas
export function validTargets(state: BancoData): string[] {
  const [first] = state.pending;
  if (!first) return [];
  const playing = state.turnOrder.filter((id) => state.status[id] === "playing");
  if (first.card.kind !== "second") return playing;
  return playing.filter((id) => id !== first.playerId && !hasSecond(state.hands[id]));
}

// Trois d'un coup : la cible tire jusqu'à 3 cartes, arrêt au doublon ou à 7 nombres ;
// les actions tirées pendant sont à attribuer par la cible, avant les autres actions en attente
function drawThree(state: BancoData, target: string): BancoData {
  let next = state;
  const drawnActions: BancoData["pending"] = [];
  for (let i = 0; i < THREE && !next.roundOver && next.status[target] === "playing"; i++) {
    const drawn = draw(next);
    if (!drawn) break;
    const [card, rest] = drawn;
    if (!isAction(card)) next = receive(rest, target, card);
    else if (
      card.kind === "second" &&
      !hasSecond(rest.hands[target]) &&
      !drawnActions.some((p) => p.card.kind === "second")
    ) {
      next = { ...give(rest, target, card), lastDraw: { playerId: target, card } };
    } else {
      drawnActions.push({ playerId: target, card });
      next = { ...rest, lastDraw: { playerId: target, card } };
    }
  }
  if (next.roundOver) return toDiscard(next, ...drawnActions.map((p) => p.card));
  return { ...next, pending: [...drawnActions, ...next.pending] };
}

// Applique la première action en attente à sa cible
function apply(state: BancoData, target: string): BancoData {
  const [{ playerId, card }, ...pending] = state.pending;
  const next = { ...give({ ...state, pending }, target, card), lastAction: { playerId, card, target } };
  if (card.kind === "freeze") return { ...next, status: { ...next.status, [target]: "stopped" } };
  if (card.kind === "three") return drawThree(next, target);
  return next;
}

// Joueur suivant encore en jeu (lui-même s'il est le seul)
function passTurn(state: BancoData): BancoData {
  const start = state.turnOrder.indexOf(state.currentPlayer!);
  for (let step = 1; step <= state.turnOrder.length; step++) {
    const playerId = state.turnOrder[(start + step) % state.turnOrder.length];
    if (state.status[playerId] === "playing") return { ...state, currentPlayer: playerId };
  }
  return endRound(state);
}

// Après chaque changement : les actions sans choix possible sont résolues d'office (défaussées si leur joueur
// n'est plus en jeu ou sans cible, appliquées à la seule cible possible) ; puis, si plus rien n'attend,
// le tour passe d'un joueur arrêté au suivant en jeu, et la manche finit quand plus personne n'est en jeu
function settle(state: BancoData): BancoData {
  let next = state;
  while (!next.roundOver && next.pending.length) {
    const [first, ...rest] = next.pending;
    const targets = validTargets(next);
    if (next.status[first.playerId] !== "playing" || !targets.length) {
      next = toDiscard({ ...next, pending: rest }, first.card);
    } else if (targets.length === 1) {
      next = apply(next, targets[0]);
    } else {
      return next;
    }
  }
  if (next.roundOver) return next;
  if (!next.turnOrder.some((id) => next.status[id] === "playing")) return endRound(next);
  return next.status[next.currentPlayer!] === "playing" ? next : passTurn(next);
}

// Nouvelle manche : une carte à chaque joueur (une action reçue est à attribuer aussitôt).
// La pioche continue d'une manche à l'autre : les cartes jouées partent à la défausse.
// Le premier joueur change à chaque manche (`round` commence à 1).
export function deal(playerIds: string[], round: number, previous?: BancoData, random = Math.random): BancoData {
  const shift = (round - 1) % playerIds.length;
  const turnOrder = [...playerIds.slice(shift), ...playerIds.slice(0, shift)];
  const played = previous
    ? [...previous.discard, ...Object.values(previous.hands).flat(), ...previous.pending.map((p) => p.card)]
    : [];
  let state: BancoData = {
    deck: previous ? previous.deck : shuffle(createDeck(), random),
    discard: played,
    hands: Object.fromEntries(turnOrder.map((id) => [id, []])),
    status: Object.fromEntries(turnOrder.map((id) => [id, "playing"])),
    turnOrder,
    currentPlayer: turnOrder[0],
    pending: [],
    lastDraw: null,
    lastAction: null,
    roundOver: false,
  };
  for (const playerId of turnOrder) {
    const drawn = draw(state, random);
    if (!drawn) break;
    const [card, rest] = drawn;
    state = isAction(card) ? drawAction(rest, playerId, card) : receive(rest, playerId, card);
  }
  return settle({ ...state, lastDraw: null });
}

const isTurnOf = (state: BancoData, playerId: string) =>
  !state.roundOver && !state.pending.length && state.currentPlayer === playerId && state.status[playerId] === "playing";

// Encore : le joueur prend la carte du dessus, puis le tour passe
export function hit(state: BancoData, playerId: string): BancoData | null {
  if (!isTurnOf(state, playerId)) return null;
  const drawn = draw(state);
  if (!drawn) return null;
  const [card, rest] = drawn;
  const next = isAction(card) ? drawAction(rest, playerId, card) : receive(rest, playerId, card);
  return next.roundOver ? next : settle(passTurn(next));
}

// Stop : le joueur garde ses points pour la manche
export function stay(state: BancoData, playerId: string): BancoData | null {
  if (!isTurnOf(state, playerId)) return null;
  return settle(passTurn({ ...state, status: { ...state.status, [playerId]: "stopped" } }));
}

// Cible choisie pour la première action en attente, par le joueur qui doit l'attribuer
export function chooseTarget(state: BancoData, playerId: string, target: string): BancoData | null {
  if (state.roundOver || state.pending[0]?.playerId !== playerId || !validTargets(state).includes(target)) return null;
  return settle(apply(state, target));
}

// Joueur parti : il s'arrête avec ses points ; ses actions en attente sont défaussées et son tour passe
export function leave(state: BancoData, playerId: string): BancoData {
  if (state.roundOver || state.status[playerId] !== "playing") return state;
  return settle({ ...state, status: { ...state.status, [playerId]: "stopped" } });
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

// Partie diffusée : pioche et défausse ne sont données que par leur nombre de cartes
export function view({ deck, discard, ...state }: BancoData): PublicBancoData {
  return { ...structuredClone(state), deckCount: deck.length, discardCount: discard.length };
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
    pending: state.pending.map((p) => ({ ...p, playerId: rename(p.playerId) })),
    lastDraw: state.lastDraw && { ...state.lastDraw, playerId: rename(state.lastDraw.playerId) },
    lastAction: state.lastAction && {
      ...state.lastAction,
      playerId: rename(state.lastAction.playerId),
      target: rename(state.lastAction.target),
    },
  };
}
