// Moteurs de jeu : chaque jeu de la plateforme fournit ses règles pures (sans accès base ni socket).
// Le socle commun (salons, rooms, présence, rejouer, historique) choisit le moteur selon le type de la partie.

import type {
  BancoData,
  GameData,
  GameKind,
  Intent,
  MoveType,
  PublicBancoData,
  PublicGameData,
} from "../../../shared/types.ts";
import * as banco from "./banco/rules.ts";
import { applyIntent } from "./moves.ts";
import { renamePlayer } from "./players.ts";
import * as rules from "./rules.ts";
import { hideCards } from "./view.ts";

export type GameResult = { finished: boolean; winner: string | null; winnerScore: number | null };

// S : état enregistré d'une manche ; V : état diffusé aux joueurs
export type GameEngine<S, V> = {
  minPlayers: number;
  maxPlayers: number;
  // Coups acceptés dans play-move
  moves: readonly MoveType[];
  // Nouvelle manche distribuée entre ces joueurs (`round` commence à 1), à la suite de la manche précédente
  deal(playerIds: string[], round: number, previous?: S): S;
  // Partie après le coup voulu par le joueur, manche avancée ; null si le coup est impossible
  play(state: S, playerId: string, intent: Intent): S | null;
  // Joueur parti en cours de manche (le jeu peut passer son tour)
  leave(state: S, playerId: string): S;
  isRoundOver(state: S): boolean;
  roundScores(state: S): rules.Scores;
  // Fin de partie et gagnant d'après les totaux
  result(totals: rules.Scores): GameResult;
  // Partie telle que diffusée aux joueurs (cartes non révélées masquées)
  view(state: S): V;
  // Remplace l'identifiant d'un joueur (invité devenu compte)
  renamePlayer(state: S, from: string, to: string): S;
};

const colonnes: GameEngine<GameData, PublicGameData> = {
  minPlayers: 2,
  maxPlayers: 8,
  moves: ["draw", "take-discard", "discard-drawn", "replace", "flip", "reveal"],
  deal: (playerIds) => rules.dealCards(playerIds),
  play: (state, playerId, intent) => {
    const next = applyIntent(state, playerId, intent);
    return next && rules.advanceGame(next);
  },
  // Un joueur absent garde sa place : la manche l'attend (comportement d'origine)
  leave: (state) => state,
  isRoundOver: (state) => state.currentStep === "endGame",
  roundScores: rules.computeRoundScores,
  result: rules.checkMaximumScore,
  view: hideCards,
  renamePlayer,
};

const bancoEngine: GameEngine<BancoData, PublicBancoData> = {
  minPlayers: 2,
  maxPlayers: 8,
  moves: ["hit", "stay", "target"],
  deal: (playerIds, round, previous) => banco.deal(playerIds, round, previous),
  play: (state, playerId, { move, target }) => {
    if (move === "hit") return banco.hit(state, playerId);
    if (move === "stay") return banco.stay(state, playerId);
    if (move === "target" && target) return banco.chooseTarget(state, playerId, target);
    return null;
  },
  leave: banco.leave,
  isRoundOver: (state) => state.roundOver,
  roundScores: banco.roundScores,
  result: banco.result,
  view: banco.view,
  renamePlayer: banco.renamePlayer,
};

// Moteur d'un jeu quelconque : l'état est celui enregistré pour la partie, de forme propre au jeu
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyEngine = GameEngine<any, any>;

const ENGINES: Record<GameKind, AnyEngine> = { colonnes, banco: bancoEngine };

export const GAME_KINDS = Object.keys(ENGINES) as GameKind[];

export function engineFor(kind: string): AnyEngine | undefined {
  return Object.hasOwn(ENGINES, kind) ? ENGINES[kind as GameKind] : undefined;
}

// Tous les coups connus, quel que soit le jeu (contrôle des données de play-move)
export const ALL_MOVES = [...new Set(Object.values(ENGINES).flatMap((engine) => engine.moves))];
