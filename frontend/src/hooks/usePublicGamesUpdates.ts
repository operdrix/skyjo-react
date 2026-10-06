import { useWebSocket } from "@/hooks/WebSocket";
import { useEffect, useEffectEvent } from "react";

// Suit la liste des parties publiques : onChange est appelé dès que le serveur signale un changement,
// et après chaque abonnement (connexion ou reconnexion) pour rattraper un changement manqué
export function usePublicGamesUpdates(onChange: () => void) {
  const { socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const handleChange = useEffectEvent(() => onChange());

  useEffect(() => {
    if (!socket || !isConnected) return;
    let active = true;

    const handleChanged = () => handleChange();
    subscribeToEvent("public-games-changed", handleChanged);
    sendMessage("watch-public-games", {}).then((response) => {
      if (active && response.ok) handleChange();
    });

    return () => {
      active = false;
      unsubscribeFromEvent("public-games-changed", handleChanged);
    };
  }, [socket, isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent]);
}
