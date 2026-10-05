// Vue des joueurs : module pur, sans accès base ni socket.
// Personne ne connaît une carte face cachée, pas même son propriétaire : la vue est la même pour tous.

import type { Card, GameData, PublicGameData, ShownCard } from "../../../shared/types.ts";

function hideCard({ id, revealed, onHand, value, color }: Card): ShownCard {
  return revealed ? { id, value, color, revealed, onHand } : { id, revealed, onHand };
}

// Masque les cartes non révélées des joueurs et de la pioche ; en fin de manche, les cartes des joueurs sont montrées
// (une partie pas encore distribuée n'a pas de cartes : elle est renvoyée telle quelle)
export function hideCards(gameData: GameData): PublicGameData {
  if (!gameData.playersCards) return gameData;
  const { playersCards, deckCards, ...rest } = structuredClone(gameData);
  const showAll = gameData.currentStep === "endGame";
  return {
    ...rest,
    playersCards: Object.fromEntries(
      Object.entries(playersCards).map(([playerId, cards]) => [playerId, showAll ? cards : cards.map(hideCard)]),
    ),
    deckCards: deckCards.map(hideCard),
  };
}
