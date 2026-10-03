import { opponentStats, playerStats } from '@/game/stats';
import type { GameType } from '@/types/types';
import { describe, expect, it } from 'vitest';

const game = (id: string, creator: string, winner: string | null, roundNumber: number, players: string[]) => ({
  id, creator, winner, roundNumber,
  state: winner ? 'finished' : 'playing',
  createdAt: '2026-10-01',
  players: players.map(p => ({ id: p, username: p.toLowerCase() })),
}) as unknown as GameType;

const games = [
  game('g1', 'ME', 'ME', 3, ['ME', 'BOB']),
  game('g2', 'BOB', 'BOB', 5, ['ME', 'BOB', 'ZOE']),
  game('g3', 'ME', null, 1, ['ME', 'ZOE']),
];

describe('statistiques du joueur', () => {
  it('compte victoires, défaites, parties et manches', () => {
    expect(playerStats(games, 'ME')).toEqual({
      victories: 1, defeats: 1, finishedGames: 2, createdGames: 2, victoryRate: 50, totalRounds: 9, maxRounds: 5,
    });
  });

  it('donne 0 % de victoires sans partie terminée', () => {
    expect(playerStats([], 'ME').victoryRate).toBe(0);
  });
});

describe('statistiques par adversaire', () => {
  it('ne compte que les parties terminées, triées par nombre de parties', () => {
    expect(opponentStats(games, 'ME')).toEqual([
      { id: 'BOB', username: 'bob', games: 2, victories: 1, defeats: 1, rounds: 8 },
      { id: 'ZOE', username: 'zoe', games: 1, victories: 0, defeats: 1, rounds: 5 },
    ]);
  });
});
