
type ErrorType = {
  code: number,
  error: string
}

type Card = {
  id: string;
  value: number;
  color: 'negative' | 'green' | 'yellow' | 'zero' | 'red';
  revealed: boolean;
  onHand: boolean;
};

type GameData = {
  playersCards: Record<string, Card[]>;
  deckCards: Card[];
  discardPile: Card[];
  currentPlayer: string | null;
  currentStep: 'initialReveal' | 'draw' | 'replace-discard' | 'decide-deck' | 'replace-deck' | 'flip-deck' | 'endTurn' | 'endGame';
  turnOrder: string[];
  lastTurn: boolean;
  firstPlayerToEnd: string | null;
};

type GameType = {
  id: string,
  players: Array<{
    id: string,
    username: string,
    game_players: {
      userId: string,
      gameId: string,
      status: 'connected' | 'disconnected',
      score: number,
      scoreByRound: number[],
    }
  }>,
  state: string,
  private: boolean,
  createdAt: string,
  creator: string,
  roundNumber: number,
  updatedAt: string,
  winner: string,
  winnerScore: number,
  maxPlayers: number,
  creatorPlayer: {
    id: string,
    username: string
  },
  gameData: GameData
}
export type { Card, ErrorType, GameData, GameType };

