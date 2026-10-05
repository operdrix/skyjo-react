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

// ─── Événements temps réel ───────────────────────────────────────────────────

// Accusé de réception renvoyé par le serveur pour chaque événement du client
export type Ack = { ok: true } | { ok: false; message: string; reason?: "session-expired" };

export type RoomPayload = { room: string };

// Événements envoyés par le client (toujours avec un accusé de réception)
export type ClientPayloads = {
  "player-joined-game": RoomPayload;
  "update-game-params": RoomPayload;
  "start-game": RoomPayload;
  "restart-game": RoomPayload;
  "player-play-again": RoomPayload;
  "initial-turn-card": RoomPayload & { cardId: string };
  "play-move": RoomPayload & { gameData: GameData };
};
export type ClientEvent = keyof ClientPayloads;

export type ClientToServerEvents = {
  [E in ClientEvent]: (data: ClientPayloads[E], ack: (response: Ack) => void) => void;
};

// Nouvelle partie créée par « Rejouer »
export type NextGame = { gameId: string; players: string[] };

// Événements diffusés par le serveur
export type ServerToClientEvents = {
  "player-joined-game": (game: GameType) => void;
  "player-left-game": (game: GameType) => void;
  "update-game-params": (game: GameType) => void;
  "start-game": (game: GameType) => void;
  "play-move": (game: GameType) => void;
  "play-again": (game: GameType) => void;
  "waiting-deal": () => void;
  "go-to-new-game": (next: NextGame) => void;
};
export type ServerEvent = keyof ServerToClientEvents;
