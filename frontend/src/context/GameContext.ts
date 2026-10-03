import type { GameType } from "@/types/types";
import { createContext } from "react";

// Contexte seul : le provider est dans GameProvider.tsx
export type GameContextType = {
  gameId: string | null;
  game: GameType | null;
  setGameId: (gameId: string) => void;
  setGame: (game: GameType) => void;
  sound: boolean;
  setSound: (sound: boolean) => void;
};

export const GameContext = createContext<GameContextType | undefined>(undefined);
