import type { FastifyRequest } from 'fastify';
import type { Socket } from 'socket.io';

export interface UserAttributes {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  bestScore: number | null;
  verified: boolean;
  verifiedtoken: string | null;
  avatar: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  games?: GameAttributes[];
}

export interface User extends UserAttributes { }

export interface GameAttributes {
  id: string;
  name: string;
  winnerScore: number | null;
  status: 'waiting' | 'playing' | 'finished';
  roundNumber: number;
  private: boolean;
  maxPlayers: number;
  playersPlayAgain: string[];
  gameData: Record<string, any>;
  currentPlayerId: string | null;
  creator: string;
  winner: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  players?: Array<UserAttributes & { game_players?: GamePlayerAttributes }>;
  creatorPlayer?: UserAttributes;
  winPlayer?: UserAttributes;

  // Méthodes
  addPlayer?: (userId: string) => Promise<any>;
  removePlayer?: (userId: string) => Promise<any>;
}

export interface GamePlayerAttributes {
  gameId: string;
  userId: string;
  score: number;
  scoreByRound: number[];
  status: 'connected' | 'disconnected';
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<any>;
}

export interface Game extends GameAttributes { }

export interface PlayerAttributes {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  cards: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Player extends PlayerAttributes { }

export interface AuthenticatedRequest extends FastifyRequest {
  user: UserAttributes;
}

export interface WebSocketClient extends Socket {
  userId?: string;
  gameId?: string;
}

export interface GameState {
  game: GameAttributes;
  players: PlayerAttributes[];
  currentPlayer: PlayerAttributes | null;
} 