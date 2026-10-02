import ModalScoreEndGame from '@/components/game/messages/ModalScoreEndGame';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sendMessage = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/Game', () => ({
  useGame: () => ({
    game: {
      id: 'g1',
      state: 'finished',
      creator: 'ALICE',
      playersPlayAgain: [],
      players: [
        { id: 'ALICE', username: 'alice', game_players: { score: 10, scoreByRound: [10] } },
        { id: 'BOB', username: 'bob', game_players: { score: 100, scoreByRound: [100] } },
      ],
      gameData: { currentStep: 'endGame', playersCards: {} },
    },
    setGame: vi.fn(),
  }),
}));
vi.mock('@/hooks/User', () => ({ useUser: () => ({ userId: 'BOB' }) }));
vi.mock('@/hooks/WebSocket', () => ({
  useWebSocket: () => ({ sendMessage, subscribeToEvent: vi.fn(), unsubscribeFromEvent: vi.fn() }),
}));

afterEach(cleanup);

describe('ModalScoreEndGame', () => {
  it("demande à rejouer avec l'événement attendu par le serveur", () => {
    render(<MemoryRouter><ModalScoreEndGame /></MemoryRouter>);

    fireEvent.click(screen.getByText('Ok pour rejouer'));

    expect(sendMessage).toHaveBeenCalledWith('player-play-again', { room: 'g1' });
  });
});
