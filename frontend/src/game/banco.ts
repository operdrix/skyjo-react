// Banco : logique pure de la table (mêmes règles de score que le serveur)
import type { BancoCard, BancoStatus } from "../../../shared/types";

export const TARGET_SCORE = 200;
const SEVEN = 7;
const SEVEN_BONUS = 15;

// Points provisoires d'un joueur : somme des nombres, +15 pour 7 nombres différents, 0 s'il est éliminé
export function handTotal(hand: BancoCard[], status: BancoStatus): number {
  if (status === "busted") return 0;
  const sum = hand.reduce((total, card) => total + card.value, 0);
  return sum + (new Set(hand.map((card) => card.value)).size >= SEVEN ? SEVEN_BONUS : 0);
}

export const STATUS_LABELS: Record<BancoStatus, string> = {
  playing: "En jeu",
  stopped: "Arrêté",
  busted: "Éliminé",
};
