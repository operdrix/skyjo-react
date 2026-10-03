import { useGame } from "@/hooks/Game";
import { useUser } from "@/hooks/User";
import { useWebSocket } from "@/hooks/WebSocket";
import type { GameType } from "@/types/types";
import { useEffect } from "react";
import { useNavigate } from "react-router";

// Événements socket de la partie en cours : mises à jour de la partie, distribution, nouvelle partie
export function useGameEvents(onWaitingDeal: (waiting: boolean) => void, enabled: boolean) {
  const { socket, isConnected, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { setGame } = useGame();
  const { userId } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !isConnected || !enabled) return;

    const handleWaitingDeal = () => onWaitingDeal(true);

    const handleStartGame = (updatedGame: GameType) => {
      setGame(updatedGame);
      onWaitingDeal(false);
    };

    // Les joueurs qui ont demandé à rejouer suivent la nouvelle partie, les autres retournent à l'accueil
    const handleGoToNewGame = ({ gameId, players }: { gameId: string; players: string[] }) => {
      if (!gameId || !players || !userId) return;
      navigate(players.includes(userId) ? `/game/${gameId}` : "/");
    };

    const updates = ["player-joined-game", "player-left-game", "update-game-params", "play-move"];

    subscribeToEvent("waiting-deal", handleWaitingDeal);
    subscribeToEvent("start-game", handleStartGame);
    updates.forEach((event) => subscribeToEvent(event, setGame));
    subscribeToEvent("go-to-new-game", handleGoToNewGame);

    return () => {
      unsubscribeFromEvent("waiting-deal", handleWaitingDeal);
      unsubscribeFromEvent("start-game", handleStartGame);
      updates.forEach((event) => unsubscribeFromEvent(event, setGame));
      unsubscribeFromEvent("go-to-new-game", handleGoToNewGame);
    };
  }, [socket, isConnected, enabled, subscribeToEvent, unsubscribeFromEvent, setGame, onWaitingDeal, userId, navigate]);
}
