import { GameContext } from "@/context/GameContext";
import { useContext } from "react";

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}