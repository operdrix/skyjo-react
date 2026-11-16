// Robots : choix du coup d'un robot, module pur (sans base ni socket).
// Le robot ne reçoit que la vue masquée de la partie, celle de tous les joueurs : il ne connaît jamais
// une carte face cachée ni la pioche. Il renvoie une intention, jouée comme celle d'un humain.

import type { BotLevel, Intent, PublicGameData, ShownCard } from "../../../shared/types.ts";

type Random = () => number;

// Carte de la main du robot, avec sa place dans le jeu
type Slot = { index: number; card: ShownCard };

const pick = <T>(items: T[], random: Random): T => items[Math.floor(random() * items.length)];

function slots(view: PublicGameData, botId: string): Slot[] {
  return view.playersCards[botId].map((card, index) => ({ index, card }));
}

const hidden = (cards: Slot[]) => cards.filter(({ card }) => !card.revealed);

// Au-delà, poser une carte sur une carte cachée (qui vaut 5 en moyenne) est absurde
const HIGH_CARD = 9;

// Places où poser une carte de valeur `value` sans coup absurde : une carte visible plus forte,
// ou une carte cachée si la carte n'est pas forte
const usefulTargets = (cards: Slot[], value: number) =>
  cards.filter(({ card }) => (card.revealed ? card.value! > value : value < HIGH_CARD));

// Carte en main : la carte piochée (dessus de la pioche) ou celle prise sur la défausse
function cardInHand(view: PublicGameData): number {
  if (view.currentStep === "decide-deck") return view.deckCards[0].value!;
  return view.discardPile[view.discardPile.length - 1].value!;
}

const replace = (target: Slot): Intent => ({ move: "replace", cardIndex: target.index });
const flip = (target: Slot): Intent => ({ move: "flip", cardIndex: target.index });

// Facile : au hasard parmi les coups permis, sans jamais de coup absurde
function easyIntent(view: PublicGameData, cards: Slot[], random: Random): Intent {
  switch (view.currentStep) {
    case "draw": {
      const discard = view.discardPile[view.discardPile.length - 1];
      const canTakeDiscard = usefulTargets(cards, discard.value!).length > 0;
      return canTakeDiscard && random() < 0.5 ? { move: "take-discard" } : { move: "draw" };
    }
    case "decide-deck": {
      const value = cardInHand(view);
      const targets = usefulTargets(cards, value);
      // Jeter une carte négative ou nulle serait absurde
      const canDiscard = hidden(cards).length > 0 && value > 0;
      if (canDiscard && (targets.length === 0 || random() < 0.5)) return { move: "discard-drawn" };
      return replace(targets.length ? pick(targets, random) : forcedTarget(cards, value, random));
    }
    case "replace-discard": {
      const value = cardInHand(view);
      const targets = usefulTargets(cards, value);
      return replace(targets.length ? pick(targets, random) : forcedTarget(cards, value, random));
    }
    default:
      return flip(pick(hidden(cards), random));
  }
}

// Valeur moyenne d'une carte cachée (paquet complet de 150 cartes)
const HIDDEN_AVERAGE = 760 / 150;

// Moyen : garde les cartes basses et remplace sa plus forte carte visible
function mediumIntent(view: PublicGameData, cards: Slot[], random: Random): Intent {
  // Meilleure place pour une carte de valeur `value` et ce qu'elle fait gagner
  const bestPlace = (value: number) => {
    const visible = cards.filter(({ card }) => card.revealed);
    const highest = visible.length ? leastBad(visible) : null;
    const highestGain = highest ? highest.card.value! - value : -Infinity;
    const hiddenCards = hidden(cards);
    const hiddenGain = hiddenCards.length ? HIDDEN_AVERAGE - value : -Infinity;
    if (highestGain >= hiddenGain) return { slot: highest!, gain: highestGain };
    return { slot: pick(hiddenCards, random), gain: hiddenGain };
  };

  switch (view.currentStep) {
    case "draw": {
      const discard = view.discardPile[view.discardPile.length - 1].value!;
      return bestPlace(discard).gain >= 3 ? { move: "take-discard" } : { move: "draw" };
    }
    case "replace-discard":
      return replace(bestPlace(cardInHand(view)).slot);
    case "decide-deck": {
      const place = bestPlace(cardInHand(view));
      if (place.gain >= 1 || hidden(cards).length === 0) return replace(place.slot);
      return { move: "discard-drawn" };
    }
    default:
      return flip(pick(hidden(cards), random));
  }
}

// ─── Difficile ───────────────────────────────────────────────────────────────

// Composition du paquet : 5 cartes −2, 10 cartes −1, 15 cartes 0, 10 cartes de chaque valeur de 1 à 12
const DECK_COUNTS: Record<number, number> = { [-2]: 5, [-1]: 10, 0: 15 };
for (let value = 1; value <= 12; value++) DECK_COUNTS[value] = 10;

// Valeur moyenne des cartes encore inconnues, d'après toutes les cartes visibles par tous
// (jeux des joueurs, défausse, carte piochée)
function unknownAverage(view: PublicGameData): number {
  const remaining = { ...DECK_COUNTS };
  const seen = [...Object.values(view.playersCards).flat(), ...view.discardPile, ...view.deckCards];
  for (const card of seen) {
    if (card.revealed && card.value !== undefined) remaining[card.value]--;
  }
  let total = 0;
  let count = 0;
  for (const [value, left] of Object.entries(remaining)) {
    total += Number(value) * Math.max(0, left);
    count += Math.max(0, left);
  }
  return count ? total / count : HIDDEN_AVERAGE;
}

// Cartes de la même colonne qu'une place (colonnes : indices i, i + n/3, i + 2n/3)
function columnMates(cards: Slot[], index: number): Slot[] {
  const offset = cards.length / 3;
  const column = index % offset;
  return [column, column + offset, column + 2 * offset].filter((i) => i !== index).map((i) => cards[i]);
}

// Score estimé d'un jeu : cartes visibles, cartes cachées à la valeur moyenne inconnue,
// colonnes de 3 cartes visibles identiques retirées
function estimatedScore(cards: ShownCard[], average: number): number {
  const offset = cards.length / 3;
  let score = 0;
  for (let column = 0; column < offset; column++) {
    const trio = [cards[column], cards[column + offset], cards[column + 2 * offset]];
    const complete = trio.every((card) => card.revealed) && trio.every((card) => card.value === trio[0].value);
    if (!complete) score += trio.reduce((sum, card) => sum + (card.revealed ? card.value! : average), 0);
  }
  return score;
}

// Difficile : compte les cartes sorties, vise les colonnes identiques et ne termine la manche
// que s'il a de bonnes chances d'avoir le plus petit score (sinon ses points seraient doublés)
function hardIntent(view: PublicGameData, botId: string, cards: Slot[], random: Random): Intent {
  const average = unknownAverage(view);
  const opponents = Object.entries(view.playersCards).filter(([id]) => id !== botId);
  const bestOpponent = Math.min(...opponents.map(([, hand]) => estimatedScore(hand, average)));
  const hiddenCount = hidden(cards).length;
  // Un autre joueur a déjà terminé : plus de risque de doublement pour le robot
  const lastTurn = view.lastTurn;

  // Jeu du robot après avoir posé `value` à la place `index` (ou retourné cette carte, à valeur moyenne)
  const handAfter = (index: number, value: number | null): ShownCard[] =>
    cards.map(({ card }, i) =>
      i === index
        ? value === null
          ? { ...card, revealed: true, value: Math.round(average) }
          : { ...card, revealed: true, value }
        : card,
    ) as ShownCard[];

  // Intérêt d'un jeu après le coup : score estimé (plus il est bas, mieux c'est), plus le risque
  // de doublement si le coup termine la manche sans avoir clairement le plus petit score
  const cost = (hand: ShownCard[]) => {
    const score = estimatedScore(hand, average);
    const ends = hand.every((card) => card.revealed);
    if (!ends || lastTurn) return score;
    // Terminer en tête est un avantage : les autres n'ont plus qu'un tour
    return score < bestOpponent - 2 ? score - 3 : score + Math.max(score, 5) + 5;
  };
  // Coût de chaque pose possible de `value`, du meilleur au moins bon
  const placements = (value: number) =>
    cards.map((slot) => ({ slot, cost: cost(handAfter(slot.index, value)) })).sort((a, b) => a.cost - b.cost);
  // Coût de retourner une carte cachée (sans rien poser) : meilleure carte cachée à retourner
  const flips = () =>
    hidden(cards)
      .map((slot) => {
        // Retourner près d'une paire visible laisse une chance de compléter la colonne
        const mates = columnMates(cards, slot.index).filter(({ card }) => card.revealed);
        const pairBonus = mates.length === 2 && mates[0].card.value === mates[1].card.value ? -1 : 0;
        return { slot, cost: cost(handAfter(slot.index, null)) + pairBonus + random() * 0.01 };
      })
      .sort((a, b) => a.cost - b.cost);
  const current = cost(cards.map(({ card }) => card));

  switch (view.currentStep) {
    case "draw": {
      const discard = view.discardPile[view.discardPile.length - 1].value!;
      const [best] = placements(discard);
      // La défausse vaut le coup si elle fait gagner nettement plus qu'une carte piochée en moyenne
      return best.cost <= current - 2.5 ? { move: "take-discard" } : { move: "draw" };
    }
    case "replace-discard":
      return replace(placements(cardInHand(view))[0].slot);
    case "decide-deck": {
      const [best] = placements(cardInHand(view));
      if (hiddenCount === 0) return replace(best.slot);
      const [flipBest] = flips();
      return best.cost <= flipBest.cost - 0.5 ? replace(best.slot) : { move: "discard-drawn" };
    }
    default:
      return flip(flips()[0].slot);
  }
}

// Plus forte carte visible
function leastBad(cards: Slot[]): Slot {
  return cards.reduce((best, slot) => (slot.card.value! > best.card.value! ? slot : best));
}

// Carte à poser alors qu'aucune place n'est bonne : sur une carte cachée s'il en reste
// (jamais à la place d'une carte visible plus faible), sinon à la place de la plus forte visible
function forcedTarget(cards: Slot[], value: number, random: Random): Slot {
  const visible = cards.filter(({ card }) => card.revealed);
  const highest = visible.length ? leastBad(visible) : null;
  if (highest && highest.card.value! > value) return highest;
  const hiddenCards = hidden(cards);
  return hiddenCards.length ? pick(hiddenCards, random) : highest!;
}

// Coup du robot `botId`, ou null s'il n'a rien à faire maintenant
export function chooseIntent(
  view: PublicGameData,
  botId: string,
  level: BotLevel,
  random: Random = Math.random,
): Intent | null {
  const cards = view.playersCards?.[botId];
  if (!cards) return null;
  const mine = slots(view, botId);

  if (view.currentStep === "initialReveal") {
    if (cards.filter((card) => card.revealed).length >= 2) return null;
    return { move: "reveal", cardIndex: pick(hidden(mine), random).index };
  }
  if (view.currentPlayer !== botId) return null;
  if (!["draw", "decide-deck", "replace-discard", "flip-deck"].includes(view.currentStep)) return null;
  if (level === "facile") return easyIntent(view, mine, random);
  if (level === "moyen") return mediumIntent(view, mine, random);
  return hardIntent(view, botId, mine, random);
}
