// Scores de partie : logique pure pour le tableau des scores et les résultats de manche
export type RankedPlayer = {
  id: string;
  username: string;
  rank: number;
  total: number;
  lastRound: number | null;
  rounds: number[];
};

type ScoredPlayer = { id: string; username: string; game_players: { score: number; scoreByRound: number[] } };

// Classement : le plus petit total gagne, les ex aequo partagent le même rang
export function rankPlayers(players: ScoredPlayer[]): RankedPlayer[] {
  const sorted = players
    .map(({ id, username, game_players: { score, scoreByRound } }) => ({
      id,
      username,
      total: score,
      rounds: scoreByRound,
      lastRound: scoreByRound.length > 0 ? scoreByRound[scoreByRound.length - 1] : null,
    }))
    .sort((a, b) => a.total - b.total);
  return sorted.map((player) => ({ ...player, rank: sorted.findIndex((p) => p.total === player.total) + 1 }));
}

// Points avec un vrai signe moins : « −4 », et « +30 » pour les points d'une manche
export const formatScore = (value: number): string => (value < 0 ? `−${-value}` : `${value}`);
export const formatPoints = (value: number): string => (value < 0 ? formatScore(value) : `+${value}`);
