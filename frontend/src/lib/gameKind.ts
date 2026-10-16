import type { GameKind } from "../../../shared/types";

const KINDS: GameKind[] = ["colonnes", "banco"];

// Jeu servi par ce front, d'après la configuration (colonnes par défaut)
export const gameKindFrom = (value: string | undefined): GameKind =>
  KINDS.includes(value as GameKind) ? (value as GameKind) : "colonnes";

// En attendant le choix par domaine (phase 5 de docs/PLAN-plateforme.md) : VITE_GAME=banco au lancement de Vite
export const GAME_KIND = gameKindFrom(import.meta.env.VITE_GAME);
