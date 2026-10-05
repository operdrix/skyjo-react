import { useGame } from "@/hooks/Game";
import { useWebSocket } from "@/hooks/WebSocket";
import { api } from "@/services/apiService";
import { useCallback } from "react";
import type { Ack, ClientEvent, ClientPayloads } from "../../../shared/types";

// Action jouée sur le plateau : après un refus (déjà signalé au joueur),
// le plateau reprend l'état de la partie lu sur le serveur
export function useGameAction() {
  const { sendMessage } = useWebSocket();
  const { setGame } = useGame();

  return useCallback(
    async <E extends ClientEvent>(event: E, data: ClientPayloads[E]): Promise<Ack> => {
      const response = await sendMessage(event, data);
      if (!response.ok && response.reason !== "session-expired") {
        const { data: game } = await api.get(`game/${data.room}`);
        if (game) setGame(game);
      }
      return response;
    },
    [sendMessage, setGame],
  );
}
