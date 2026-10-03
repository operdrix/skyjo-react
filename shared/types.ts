// Types partagés entre le backend et le frontend (uniquement des types : effacés à l'exécution)

export type ErrorType = {
  code: number;
  error: string;
};

export type CardColor = "negative" | "green" | "yellow" | "zero" | "red";

export type Card = {
  id: string;
  value: number;
  color: CardColor;
  revealed: boolean;
  onHand: boolean;
};

export type GameStep =
  "initialReveal" | "draw" | "replace-discard" | "decide-deck" | "replace-deck" | "flip-deck" | "endTurn" | "endGame";

export type GameData = {
  playersCards: Record<string, Card[]>;
  deckCards: Card[];
  discardPile: Card[];
  currentPlayer: string | null;
  currentStep: GameStep;
  turnOrder: string[];
  lastTurn: boolean;
  firstPlayerToEnd: string | null;
};

export type GameState = "pending" | "playing" | "finished";

export type PlayerStatus = "connected" | "disconnected";

export type PublicUser = {
  id: string;
  username: string;
};

// Joueur d'une partie tel que renvoyé par l'API
export type GamePlayer = PublicUser & {
  game_players: {
    userId: string;
    gameId: string;
    status: PlayerStatus;
    score: number;
    scoreByRound: number[];
  };
};

// Partie telle que renvoyée par l'API et diffusée par les websockets
export type GameType = {
  id: string;
  players: GamePlayer[];
  state: GameState;
  private: boolean;
  createdAt: string;
  updatedAt: string;
  creator: string;
  roundNumber: number;
  winner: string | null;
  winnerScore: number | null;
  maxPlayers: number;
  creatorPlayer: PublicUser;
  gameData: GameData;
  playersPlayAgain: string[];
};
