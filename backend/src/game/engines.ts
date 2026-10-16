// Moteurs de jeu : chaque jeu de la plateforme fournit ses règles pures (sans accès base ni socket).
// Le socle commun (salons, rooms, présence, rejouer, historique) choisit le moteur selon le type de la partie.

import type { GameData, GameKind, Intent, MoveType, PublicGameData } from "../../../shared/types.ts";
import { applyIntent } from "./moves.ts";
import { renamePlayer } from "./players.ts";
import * as rules from "./rules.ts";
import { hideCards } from "./view.ts";

export type GameResult = { finished: boolean; winner: string | null; winnerScore: number | null };

export type GameEngine = {
  minPlayers: number;
  maxPlayers: number;
  // Coups acceptés dans play-move
  moves: readonly MoveType[];
  // Nouvelle manche distribuée entre ces joueurs
  deal(playerIds: string[]): GameData;
  // Partie après le coup voulu par le joueur, manche avancée ; null si le coup est impossible
  play(state: GameData, playerId: string, intent: Intent): GameData | null;
  isRoundOver(state: GameData): boolean;
  roundScores(state: GameData): rules.Scores;
  // Fin de partie et gagnant d'après les totaux
  result(totals: rules.Scores): GameResult;
  // Partie telle que diffusée aux joueurs (cartes non révélées masquées)
  view(state: GameData): PublicGameData;
  // Remplace l'identifiant d'un joueur (invité devenu compte)
  renamePlayer(state: GameData, from: string, to: string): GameData;
};

const colonnes: GameEngine = {
  minPlayers: 2,
  maxPlayers: 8,
  moves: ["draw", "take-discard", "discard-drawn", "replace", "flip", "reveal"],
  deal: (playerIds) => rules.dealCards(playerIds),
  play: (state, playerId, intent) => {
    const next = applyIntent(state, playerId, intent);
    return next && rules.advanceGame(next);
  },
  isRoundOver: (state) => state.currentStep === "endGame",
  roundScores: rules.computeRoundScores,
  result: rules.checkMaximumScore,
  view: hideCards,
  renamePlayer,
};

const ENGINES: Record<GameKind, GameEngine> = { colonnes };

export const GAME_KINDS = Object.keys(ENGINES) as GameKind[];

export function engineFor(kind: string): GameEngine | undefined {
  return Object.hasOwn(ENGINES, kind) ? ENGINES[kind as GameKind] : undefined;
}

// Tous les coups connus, quel que soit le jeu (contrôle des données de play-move)
export const ALL_MOVES = [...new Set(Object.values(ENGINES).flatMap((engine) => engine.moves))];
