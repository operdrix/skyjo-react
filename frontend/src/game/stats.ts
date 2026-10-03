import type { GameType } from '@/types/types';

export type OpponentStats = { id: string; username: string; games: number; victories: number; defeats: number; rounds: number };

// Statistiques du joueur sur l'ensemble de ses parties
export function playerStats(games: GameType[], userId: string) {
  const victories = games.filter(game => game.winner === userId).length;
  const finishedGames = games.filter(game => game.state === 'finished').length;
  return {
    victories,
    defeats: games.filter(game => game.winner && game.winner !== userId).length,
    finishedGames,
    createdGames: games.filter(game => game.creator === userId).length,
    victoryRate: finishedGames ? Math.round((victories / finishedGames) * 100) : 0,
    totalRounds: games.reduce((total, game) => total + game.roundNumber, 0),
    maxRounds: games.reduce((max, game) => Math.max(max, game.roundNumber), 0),
  };
}

// Bilan de chaque adversaire sur les parties terminées (victoires et défaites vues de l'adversaire),
// du plus souvent rencontré au moins souvent
export function opponentStats(games: GameType[], userId: string): OpponentStats[] {
  const opponents = new Map<string, OpponentStats>();

  for (const game of games) {
    if (!game.winner) continue;
    for (const player of game.players ?? []) {
      if (player.id === userId) continue;
      const stats = opponents.get(player.id)
        ?? { id: player.id, username: player.username, games: 0, victories: 0, defeats: 0, rounds: 0 };
      stats.games++;
      if (game.winner === player.id) {
        stats.victories++;
      } else {
        stats.defeats++;
      }
      stats.rounds += game.roundNumber;
      opponents.set(player.id, stats);
    }
  }
  return [...opponents.values()].sort((a, b) => b.games - a.games);
}
