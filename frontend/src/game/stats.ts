import type { GameType } from "@/types/types";

export type OpponentStats = {
  id: string;
  username: string;
  // Robots d'un même niveau regroupés (« Robot moyen » et « Robot moyen 2 »)
  isBot?: boolean;
  games: number;
  victories: number;
  defeats: number;
  rounds: number;
};

// Statistiques du joueur sur l'ensemble de ses parties
export function playerStats(games: GameType[], userId: string) {
  const victories = games.filter((game) => game.winner === userId).length;
  const finishedGames = games.filter((game) => game.state === "finished").length;
  return {
    victories,
    defeats: games.filter((game) => game.winner && game.winner !== userId).length,
    finishedGames,
    createdGames: games.filter((game) => game.creator === userId).length,
    victoryRate: finishedGames ? Math.round((victories / finishedGames) * 100) : 0,
    totalRounds: games.reduce((total, game) => total + game.roundNumber, 0),
    maxRounds: games.reduce((max, game) => Math.max(max, game.roundNumber), 0),
  };
}

type Opponent = { id: string; username: string; isBot?: boolean; botLevel?: string | null };

// Adversaire tel que compté dans le bilan : un humain par son identifiant, les robots par niveau
function opponentOf(player: Opponent) {
  if (!player.isBot || !player.botLevel) return { id: player.id, username: player.username };
  return { id: `robot-${player.botLevel}`, username: `Robot ${player.botLevel}`, isBot: true };
}

// La partie oppose-t-elle le joueur à cet adversaire (identifiant du bilan) ?
export function playsAgainst(game: GameType, opponentId: string): boolean {
  return (game.players ?? []).some((player) => opponentOf(player).id === opponentId);
}

// Bilan de chaque adversaire sur les parties terminées (victoires et défaites vues de l'adversaire),
// du plus souvent rencontré au moins souvent
export function opponentStats(games: GameType[], userId: string): OpponentStats[] {
  const opponents = new Map<string, OpponentStats>();

  for (const game of games) {
    if (!game.winner) continue;
    const players = game.players ?? [];
    const winner = players.find((player) => player.id === game.winner);
    const winnerId = winner ? opponentOf(winner).id : game.winner;
    // Un adversaire par partie : deux robots du même niveau ne comptent qu'une fois
    const met = new Map(
      players.filter((player) => player.id !== userId).map((player) => [opponentOf(player).id, opponentOf(player)]),
    );
    for (const opponent of met.values()) {
      const stats = opponents.get(opponent.id) ?? {
        ...opponent,
        games: 0,
        victories: 0,
        defeats: 0,
        rounds: 0,
      };
      stats.games++;
      if (winnerId === opponent.id) {
        stats.victories++;
      } else {
        stats.defeats++;
      }
      stats.rounds += game.roundNumber;
      opponents.set(opponent.id, stats);
    }
  }
  return [...opponents.values()].sort((a, b) => b.games - a.games);
}
