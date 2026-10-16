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

// Jeu de la plateforme auquel appartient une partie
export type GameKind = "colonnes" | "banco";

// ─── Banco : stop ou encore ──────────────────────────────────────────────────

// Nombre (0 à 12), modificateur « + » (+2 à +10) ou ×2 : les modificateurs ne comptent pas comme des nombres.
// Actions : Gel (arrête la cible), Trois d'un coup (la cible tire 3 cartes), Seconde chance (annule un doublon)
export type BancoAction = "freeze" | "three" | "second";
export type BancoCard =
  | { id: string; kind: "number"; value: number }
  | { id: string; kind: "plus"; value: number }
  | { id: string; kind: "double" }
  | { id: string; kind: BancoAction };

// En jeu, arrêté (garde ses points) ou éliminé par un doublon (0 point)
export type BancoStatus = "playing" | "stopped" | "busted";

export type BancoData = {
  // Pioche et défausse : jamais diffusées (la défausse remélangée reforme la pioche)
  deck: BancoCard[];
  discard: BancoCard[];
  hands: Record<string, BancoCard[]>;
  status: Record<string, BancoStatus>;
  turnOrder: string[];
  currentPlayer: string | null;
  // Actions à attribuer, dans l'ordre : le joueur de la première choisit sa cible, personne d'autre ne joue
  pending: { playerId: string; card: BancoCard }[];
  // Dernière carte tirée (saved : doublon annulé par une Seconde chance) et dernière action attribuée
  lastDraw: { playerId: string; card: BancoCard; saved?: boolean } | null;
  lastAction: { playerId: string; card: BancoCard; target: string } | null;
  roundOver: boolean;
};

// Données de Banco diffusées : pioche et défausse ne sont données que par leur nombre de cartes
export type PublicBancoData = Omit<BancoData, "deck" | "discard"> & { deckCount: number; discardCount: number };

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
  gameType: GameKind;
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
export type StoredGame = GameFields<GameData | BancoData> & { nextGameId: string | null };

// Partie telle que renvoyée par l'API et diffusée par les websockets (D : données du jeu, Colonnes par défaut)
export type GameType<D = PublicGameData> = GameFields<D>;

// ─── Événements temps réel ───────────────────────────────────────────────────

// Accusé de réception renvoyé par le serveur pour chaque événement du client
export type Ack = { ok: true } | { ok: false; message: string; reason?: "session-expired" };

export type RoomPayload = { room: string };

// Événement sans données
export type EmptyPayload = Record<string, never>;

// Coup joué : le client indique son intention, le serveur calcule la partie suivante
// Colonnes : draw … reveal ; Banco : hit (Encore), stay (Stop), target (cible d'une action)
export type MoveType =
  "draw" | "take-discard" | "discard-drawn" | "replace" | "flip" | "reveal" | "hit" | "stay" | "target";
// cardIndex : carte visée (Colonnes) ; target : joueur visé par une action (Banco)
export type Intent = { move: MoveType; cardIndex?: number; target?: string };

// Événements envoyés par le client (toujours avec un accusé de réception)
export type ClientPayloads = {
  "player-joined-game": RoomPayload;
  "update-game-params": RoomPayload;
  "start-game": RoomPayload;
  "restart-game": RoomPayload;
  "player-play-again": RoomPayload;
  "play-move": RoomPayload & Intent;
  // Suivre la liste des parties publiques (jusqu'à l'entrée dans une partie)
  "watch-public-games": EmptyPayload;
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
  // La liste des parties publiques a peut-être changé : à recharger
  "public-games-changed": () => void;
};
export type ServerEvent = keyof ServerToClientEvents;
