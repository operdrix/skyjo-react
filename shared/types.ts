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

// Carte telle que diffusée : face cachée, elle n'a ni valeur ni couleur
export type HiddenCard = Omit<Card, "value" | "color"> & { value?: undefined; color?: undefined };
export type ShownCard = Card | HiddenCard;

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

// Données de partie diffusées aux joueurs : les cartes non révélées sont masquées
export type PublicGameData = Omit<GameData, "playersCards" | "deckCards"> & {
  playersCards: Record<string, ShownCard[]>;
  deckCards: ShownCard[];
};

export type GameState = "pending" | "playing" | "finished";

export type PlayerStatus = "connected" | "disconnected";

export type PublicUser = {
  id: string;
  username: string;
  // Invité (joue sans compte)
  isAnonymous: boolean;
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

// Partie enregistrée, avec toutes ses cartes (jamais envoyée telle quelle)
type GameFields<D> = {
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
  gameData: D;
  playersPlayAgain: string[];
};
// nextGameId : partie créée par « Rejouer », jamais diffusée (la nouvelle partie est privée)
export type StoredGame = GameFields<GameData> & { nextGameId: string | null };

// Partie telle que renvoyée par l'API et diffusée par les websockets
export type GameType = GameFields<PublicGameData>;

// ─── Événements temps réel ───────────────────────────────────────────────────

// Accusé de réception renvoyé par le serveur pour chaque événement du client
export type Ack = { ok: true } | { ok: false; message: string; reason?: "session-expired" };

export type RoomPayload = { room: string };

// Coup joué : le client indique son intention, le serveur calcule la partie suivante
export type MoveType = "draw" | "take-discard" | "discard-drawn" | "replace" | "flip" | "reveal";
export type Intent = { move: MoveType; cardIndex?: number };

// Événements envoyés par le client (toujours avec un accusé de réception)
export type ClientPayloads = {
  "player-joined-game": RoomPayload;
  "update-game-params": RoomPayload;
  "start-game": RoomPayload;
  "restart-game": RoomPayload;
  "player-play-again": RoomPayload;
  "play-move": RoomPayload & Intent;
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
