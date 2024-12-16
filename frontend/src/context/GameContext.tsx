import { GameType } from "@/types/types";
import { createContext, useState } from "react";

type GameContextType = {
  gameId: string | null;
  game: GameType | null;
  setGameId: (gameId: string) => void;
  setGame: (game: GameType) => void;
};

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState<GameType | null>(null);

  return (
    <GameContext.Provider value={{ gameId, game, setGameId, setGame }}>
      {children}
    </GameContext.Provider>
  )
}