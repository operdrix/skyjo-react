// Ce qui distingue les jeux à l'affichage des scores
import type { Winning } from "@/game/scores";
import type { GameKind } from "@/types/types";

export const SCORING: Record<GameKind, { winning: Winning; note: string }> = {
  colonnes: { winning: "lowest", note: "Le plus petit total gagne. La partie s'arrête quand un joueur atteint 100." },
  banco: { winning: "highest", note: "Le plus haut total gagne. La partie s'arrête quand un joueur atteint 200." },
};

// Règles de score du jeu de la partie (Colonnes si le jeu est inconnu)
export const scoringOf = (game: { gameType?: GameKind }) => SCORING[game.gameType ?? "colonnes"] ?? SCORING.colonnes;
