import React, { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { type GameClientSocket, WebSocketContext } from "@/context/WebSocketContext";
import { useUser } from "@/hooks/User";
import { toast } from "@/lib/toast";
import type { Ack, ClientEvent, ClientPayloads, ServerEvent, ServerToClientEvents } from "../../../shared/types";

// Délai au-delà duquel le serveur est considéré comme injoignable
const ACK_TIMEOUT_MS = 5000;
const UNREACHABLE = "Le serveur ne répond pas, réessaie";

interface WebSocketProviderProps {
  children: React.ReactNode;
  url: string;
  enabled?: boolean; // Ne se connecte que si le joueur est authentifié
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url, enabled = true }) => {
  // Socket créé sans se connecter (la connexion est ouverte dans l'effet ci-dessous)
  const socket = useMemo<GameClientSocket | null>(
    () =>
      enabled
        ? io(url, {
            transports: ["polling", "websocket"], // Commence par polling qui transmet mieux les cookies
            autoConnect: false,
            withCredentials: true, // Envoie automatiquement les cookies httpOnly
          })
        : null,
    [url, enabled],
  );
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { refresh } = useUser();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onConnect = () => {
      setIsConnected(true);
      setLoading(false);
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setLoading(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  const sendMessage = useCallback(
    async <E extends ClientEvent>(event: E, data: ClientPayloads[E]): Promise<Ack> => {
      let response: Ack;
      try {
        if (!socket || !isConnected) throw new Error("Socket déconnecté");
        // Émission non typée : le catalogue garantit déjà la forme de event et data.
        // La méthode est appelée sur son objet (emitWithAck s'appuie sur this).
        const withTimeout = socket.timeout(ACK_TIMEOUT_MS) as unknown as {
          emitWithAck: (e: string, d: unknown) => Promise<Ack>;
        };
        response = await withTimeout.emitWithAck(event, data);
      } catch {
        response = { ok: false, message: UNREACHABLE };
      }

      if (!response.ok) {
        if (response.reason === "session-expired") {
          // Session rechargée : la page, voyant le joueur déconnecté, l'envoie vers la connexion
          refresh();
        } else {
          toast({ type: "error", message: response.message });
        }
      }
      return response;
    },
    [socket, isConnected, refresh],
  );

  const subscribeToEvent = useCallback(
    <E extends ServerEvent>(event: E, callback: ServerToClientEvents[E]) => {
      // Écoute non typée : le catalogue lie déjà event et callback
      (socket as unknown as { on: (e: string, c: unknown) => void } | null)?.on(event, callback);
    },
    [socket],
  );

  const unsubscribeFromEvent = useCallback(
    <E extends ServerEvent>(event: E, callback: ServerToClientEvents[E]) => {
      (socket as unknown as { off: (e: string, c: unknown) => void } | null)?.off(event, callback);
    },
    [socket],
  );

  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
      // Sans connexion demandée, rien n'est en cours de chargement
      loading: enabled && loading,
      sendMessage,
      subscribeToEvent,
      unsubscribeFromEvent,
    }),
    [socket, isConnected, enabled, loading, sendMessage, subscribeToEvent, unsubscribeFromEvent],
  );

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};
