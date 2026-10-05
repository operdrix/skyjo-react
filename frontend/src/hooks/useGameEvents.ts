import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import type { GameType } from "@/types/types";
import { useEffect } from "react";
import { useNavigate } from "react-router";

// Durée minimale de l'animation de distribution, comptée depuis l'annonce
export const DEAL_ANIMATION_MS = 3000;

// Événements socket de la partie en cours : mises à jour de la partie, distribution, nouvelle partie
// (les mises à jour d'une autre partie, encore en vol après un changement de partie, sont ignorées)
export function useGameEvents(gameId: string | undefined, onWaitingDeal: (waiting: boolean) => void, enabled: boolean) {
  const { socket, isConnected, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { setGame } = useGame();
  const { userId } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !isConnected || !enabled) return;

    // L'animation de distribution est minutée ici : le serveur envoie la manche sans attendre
    let dealStartedAt = 0;
    let dealTimer: ReturnType<typeof setTimeout> | undefined;

    const handleWaitingDeal = () => {
      dealStartedAt = Date.now();
      onWaitingDeal(true);
    };

    const handleUpdate = (updatedGame: GameType) => {
      if (updatedGame.id === gameId) setGame(updatedGame);
    };

    const handleStartGame = (updatedGame: GameType) => {
      if (updatedGame.id !== gameId) return;
      setGame(updatedGame);
      const remaining = DEAL_ANIMATION_MS - (Date.now() - dealStartedAt);
      if (remaining > 0) {
        dealTimer = setTimeout(() => onWaitingDeal(false), remaining);
      } else {
        onWaitingDeal(false);
      }
    };

    // Les joueurs qui ont demandé à rejouer suivent la nouvelle partie, les autres retournent à l'accueil
    const handleGoToNewGame = ({ gameId, players }: { gameId: string; players: string[] }) => {
      if (!gameId || !players || !userId) return;
      navigate(players.includes(userId) ? `/game/${gameId}` : "/");
    };

    const updates = ["player-joined-game", "player-left-game", "update-game-params", "play-move"] as const;

    subscribeToEvent("waiting-deal", handleWaitingDeal);
    subscribeToEvent("start-game", handleStartGame);
    updates.forEach((event) => subscribeToEvent(event, handleUpdate));
    subscribeToEvent("go-to-new-game", handleGoToNewGame);

    return () => {
      // Animation interrompue : on affiche directement la manche déjà reçue
      if (dealTimer) {
        clearTimeout(dealTimer);
        onWaitingDeal(false);
      }
      unsubscribeFromEvent("waiting-deal", handleWaitingDeal);
      unsubscribeFromEvent("start-game", handleStartGame);
      updates.forEach((event) => unsubscribeFromEvent(event, handleUpdate));
      unsubscribeFromEvent("go-to-new-game", handleGoToNewGame);
    };
  }, [
    gameId,
    socket,
    isConnected,
    enabled,
    subscribeToEvent,
    unsubscribeFromEvent,
    setGame,
    onWaitingDeal,
    userId,
    navigate,
  ]);
}
