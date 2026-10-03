import {
  discardDrawnCard,
  drawFromDeck,
  flipCard,
  replaceWithDiscard,
  replaceWithDrawn,
  revealInitialCard,
  takeDiscard,
} from '@/game/moves';
import type { Card, GameData } from '@/types/types';
import { describe, expect, it } from 'vitest';

const card = (id: string, value: number, revealed = false): Card =>
  ({ id, value, color: 'green', revealed, onHand: false });

function gameData(step: GameData['currentStep']): GameData {
  return {
    currentStep: step,
    currentPlayer: 'ALICE',
    turnOrder: ['ALICE', 'BOB'],
    lastTurn: false,
    firstPlayerToEnd: null,
    deckCards: [card('d1', 7), card('d2', 3)],
    discardPile: [card('x1', 1, true), card('x2', 9, true)],
    playersCards: { ALICE: [card('a1', 5), card('a2', 11)], BOB: [card('b1', 2)] },
  } as GameData;
}

const topOfDiscard = (data: GameData) => data.discardPile[data.discardPile.length - 1];

// Chaque coup renvoie de nouvelles données sans toucher aux données reçues
function expectUntouched(before: GameData, original: GameData) {
  expect(original).toEqual(before);
}

describe('coups du joueur', () => {
  it('pioche : révèle la carte du dessus de la pioche, en main', () => {
    const data = gameData('draw');
    const before = structuredClone(data);

    const next = drawFromDeck(data);

    expect(next.deckCards[0]).toMatchObject({ id: 'd1', revealed: true, onHand: true });
    expect(next.currentStep).toBe('decide-deck');
    expectUntouched(before, data);
  });

  it('prend la carte du dessus de la défausse en main', () => {
    const data = gameData('draw');
    const before = structuredClone(data);

    const next = takeDiscard(data);

    expect(topOfDiscard(next)).toMatchObject({ id: 'x2', onHand: true });
    expect(next.currentStep).toBe('replace-discard');
    expectUntouched(before, data);
  });

  it('défausse la carte piochée puis doit retourner une carte', () => {
    const data = drawFromDeck(gameData('draw'));
    const before = structuredClone(data);

    const next = discardDrawnCard(data);

    expect(next.deckCards.map(c => c.id)).toEqual(['d2']);
    expect(topOfDiscard(next)).toMatchObject({ id: 'd1', onHand: false });
    expect(next.currentStep).toBe('flip-deck');
    expectUntouched(before, data);
  });

  it('échange une carte du jeu avec la carte de la défausse', () => {
    const data = takeDiscard(gameData('draw'));
    const before = structuredClone(data);

    const next = replaceWithDiscard(data, 'ALICE', 1);

    expect(next.playersCards.ALICE[1]).toMatchObject({ id: 'x2', onHand: false });
    expect(topOfDiscard(next)).toMatchObject({ id: 'a2', revealed: true, onHand: false });
    expect(next.currentStep).toBe('endTurn');
    expectUntouched(before, data);
  });

  it('échange une carte du jeu avec la carte piochée', () => {
    const data = drawFromDeck(gameData('draw'));
    const before = structuredClone(data);

    const next = replaceWithDrawn(data, 'ALICE', 0);

    expect(next.playersCards.ALICE[0]).toMatchObject({ id: 'd1', onHand: false });
    expect(topOfDiscard(next)).toMatchObject({ id: 'a1', revealed: true });
    expect(next.deckCards.map(c => c.id)).toEqual(['d2']);
    expect(next.currentStep).toBe('endTurn');
    expectUntouched(before, data);
  });

  it('retourne une carte du jeu après avoir défaussé la carte piochée', () => {
    const data = gameData('flip-deck');
    const before = structuredClone(data);

    const next = flipCard(data, 'ALICE', 1);

    expect(next.playersCards.ALICE[1].revealed).toBe(true);
    expect(next.currentStep).toBe('endTurn');
    expectUntouched(before, data);
  });

  it('révèle une carte pendant la phase initiale, deux au maximum', () => {
    const data = gameData('initialReveal');
    const before = structuredClone(data);

    const once = revealInitialCard(data, 'ALICE', 0);
    const twice = revealInitialCard(once, 'ALICE', 1);
    const third = revealInitialCard({ ...twice, playersCards: { ...twice.playersCards, ALICE: [...twice.playersCards.ALICE, card('a3', 4)] } }, 'ALICE', 2);

    expect(twice.playersCards.ALICE.every(c => c.revealed)).toBe(true);
    expect(third.playersCards.ALICE[2].revealed).toBe(false);
    expect(twice.currentStep).toBe('initialReveal');
    expectUntouched(before, data);
  });
});
