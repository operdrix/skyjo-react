// Joueurs d'une partie : module pur, sans accès base ni socket.

import type { GameData } from "../../../shared/types.ts";

// Remplace l'identifiant d'un joueur dans les données de partie (invité devenu compte)
export function renamePlayer(gameData: GameData, from: string, to: string): GameData {
  if (!gameData.playersCards) return gameData;
  const rename = (id: string | null) => (id === from ? to : id);
  return {
    ...gameData,
    playersCards: Object.fromEntries(
      Object.entries(gameData.playersCards).map(([playerId, cards]) => [rename(playerId)!, cards]),
    ),
    turnOrder: gameData.turnOrder.map((id) => rename(id)!),
    currentPlayer: rename(gameData.currentPlayer),
    firstPlayerToEnd: rename(gameData.firstPlayerToEnd),
  };
}
