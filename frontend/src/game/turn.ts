// Tour et fin de manche, quel que soit le jeu de la partie
import type { BancoGame, GameType } from "@/types/types";

const asBanco = (game: GameType) => game as unknown as BancoGame;

export function isRoundOver(game: GameType): boolean {
  return game.gameType === "banco" ? asBanco(game).gameData.roundOver : game.gameData.currentStep === "endGame";
}

// À ce joueur de jouer (Colonnes : au début de son tour, pour l'avertir une seule fois)
export function isMyTurn(game: GameType, userId: string): boolean {
  if (game.gameType === "banco") {
    const { currentPlayer, roundOver } = asBanco(game).gameData;
    return !roundOver && currentPlayer === userId;
  }
  return game.gameData.currentPlayer === userId && game.gameData.currentStep === "draw";
}
