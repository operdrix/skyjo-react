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
  return level === "facile" ? easyIntent(view, mine, random) : mediumIntent(view, mine, random);
}
