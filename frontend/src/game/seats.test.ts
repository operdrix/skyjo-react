import { tableSeats } from '@/game/seats';
import { describe, expect, it } from 'vitest';

describe('places autour de la table', () => {
  it("à 2 joueurs, l'adversaire est en face", () => {
    expect(tableSeats(['A', 'B'], 'B')).toEqual({ top: 'A', left: '', right: '' });
  });

  it('à 3 joueurs, le suivant est à gauche et le dernier en face', () => {
    expect(tableSeats(['A', 'B', 'C'], 'A')).toEqual({ top: 'C', left: 'B', right: '' });
  });

  it("à 4 joueurs, les places suivent l'ordre du tour", () => {
    expect(tableSeats(['A', 'B', 'C', 'D'], 'C')).toEqual({ left: 'D', top: 'A', right: 'B' });
  });
});
