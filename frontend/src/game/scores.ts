// Scores de partie : logique pure pour le tableau des scores et les résultats de manche
export type RankedPlayer = {
  id: string;
  username: string;
  isAnonymous?: boolean;
  rank: number;
  total: number;
  lastRound: number | null;
  rounds: number[];
};

type ScoredPlayer = {
  id: string;
  username: string;
  isAnonymous?: boolean;
  game_players: { score: number; scoreByRound: number[] };
};

// Sens du classement : le plus petit total gagne (Colonnes) ou le plus grand (Banco)
export type Winning = "lowest" | "highest";

// Classement selon le sens du jeu, les ex aequo partagent le même rang
export function rankPlayers(players: ScoredPlayer[], winning: Winning = "lowest"): RankedPlayer[] {
  const sorted = players
    .map(({ id, username, isAnonymous, game_players: { score, scoreByRound } }) => ({
      id,
      username,
      isAnonymous,
      total: score,
      rounds: scoreByRound,
      lastRound: scoreByRound.length > 0 ? scoreByRound[scoreByRound.length - 1] : null,
    }))
    .sort((a, b) => (winning === "lowest" ? a.total - b.total : b.total - a.total));
  return sorted.map((player) => ({ ...player, rank: sorted.findIndex((p) => p.total === player.total) + 1 }));
}

// Points avec un vrai signe moins : « −4 », et « +30 » pour les points d'une manche
export const formatScore = (value: number): string => (value < 0 ? `−${-value}` : `${value}`);
export const formatPoints = (value: number): string => (value < 0 ? formatScore(value) : `+${value}`);
