// Banco : logique pure de la table (mêmes règles de score que le serveur)
import type { BancoAction, BancoCard, BancoData, BancoStatus } from "../../../shared/types";

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

export const ACTION_LABELS: Record<BancoAction, string> = {
  freeze: "Gel",
  three: "Trois d'un coup",
  second: "Seconde chance",
};

export const isAction = (card: BancoCard): card is { id: string; kind: BancoAction } => card.kind in ACTION_LABELS;

// Texte d'une carte : « 7 », « +6 », « ×2 » ou le nom de l'action
export function cardLabel(card: BancoCard): string {
  if (isAction(card)) return ACTION_LABELS[card.kind];
  if (card.kind === "double") return "×2";
  return card.kind === "plus" ? `+${card.value}` : String(card.value);
}

// Cibles possibles de la première action en attente (mêmes règles que le serveur) : joueurs en jeu,
// joueur compris ; une Seconde chance se donne à un autre joueur en jeu qui n'en a pas
export function validTargets({
  turnOrder,
  status,
  hands,
  pending,
}: Pick<BancoData, "turnOrder" | "status" | "hands" | "pending">): string[] {
  const [first] = pending;
  if (!first) return [];
  const playing = turnOrder.filter((id) => status[id] === "playing");
  if (first.card.kind !== "second") return playing;
  return playing.filter((id) => id !== first.playerId && !hands[id].some((card) => card.kind === "second"));
}

export const STATUS_LABELS: Record<BancoStatus, string> = {
  playing: "En jeu",
  stopped: "Arrêté",
  busted: "Éliminé",
};
