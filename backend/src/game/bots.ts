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

// Places où poser une carte de valeur `value` sans coup absurde : une carte cachée,
// ou une carte visible plus forte
const usefulTargets = (cards: Slot[], value: number) =>
  cards.filter(({ card }) => !card.revealed || card.value! > value);

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
      const targets = usefulTargets(cards, cardInHand(view));
      if (hidden(cards).length > 0 && (targets.length === 0 || random() < 0.5)) return { move: "discard-drawn" };
      return replace(targets.length ? pick(targets, random) : leastBad(cards));
    }
    case "replace-discard": {
      const targets = usefulTargets(cards, cardInHand(view));
      return replace(targets.length ? pick(targets, random) : leastBad(cards));
    }
    default:
      return flip(pick(hidden(cards), random));
  }
}

// Plus forte carte visible : la remplacer coûte le moins quand aucun coup n'est bon
function leastBad(cards: Slot[]): Slot {
  return cards.reduce((best, slot) => (slot.card.value! > best.card.value! ? slot : best));
}

// Coup du robot `botId`, ou null s'il n'a rien à faire maintenant
export function chooseIntent(
  view: PublicGameData,
  botId: string,
  _level: BotLevel,
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
  return easyIntent(view, mine, random);
}
