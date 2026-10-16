// Banco : logique pure de la table (mêmes règles de score que le serveur)
import type { BancoCard, BancoStatus } from "../../../shared/types";

export const TARGET_SCORE = 200;
const SEVEN = 7;
const SEVEN_BONUS = 15;

export const numbers = (hand: BancoCard[]) => hand.flatMap((card) => (card.kind === "number" ? [card.value] : []));

// 7 nombres différents : bonus et fin de manche
export const hasSeven = (hand: BancoCard[]) => new Set(numbers(hand)).size >= SEVEN;

// Points provisoires d'un joueur : somme des nombres, doublée par le ×2, puis les modificateurs +,
// puis +15 pour 7 nombres différents ; 0 s'il est éliminé
export function handTotal(hand: BancoCard[], status: BancoStatus): number {
  if (status === "busted") return 0;
  const sum = numbers(hand).reduce((total, value) => total + value, 0);
  const doubled = hand.some((card) => card.kind === "double") ? sum * 2 : sum;
  const bonus = hand.reduce((total, card) => total + (card.kind === "plus" ? card.value : 0), 0);
  return doubled + bonus + (hasSeven(hand) ? SEVEN_BONUS : 0);
}

// Texte d'une carte : « 7 », « +6 » ou « ×2 »
export function cardLabel(card: BancoCard): string {
  if (card.kind === "double") return "×2";
  return card.kind === "plus" ? `+${card.value}` : String(card.value);
}

export const STATUS_LABELS: Record<BancoStatus, string> = {
  playing: "En jeu",
  stopped: "Arrêté",
  busted: "Éliminé",
};
