import { GameType } from "@/types/types";
import { useEffect, useState } from "react";
import { GameContext } from "@/context/GameContext";


export const GameProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState<GameType | null>(null);
  const [sound, setSound] = useState<boolean>(() => {
    const soundStorage = localStorage.getItem('sound');
    if (soundStorage) {
      return soundStorage === 'true';
    } else {
      localStorage.setItem('sound', 'true');
      return true;
    }
  });

  useEffect(() => {
    console.log('Sound:', sound);

    localStorage.setItem('sound', sound.toString());
  }, [sound]);

  return (
    <GameContext.Provider value={{ gameId, game, setGameId, setGame, sound, setSound }}>
      {children}
    </GameContext.Provider>
  )
}