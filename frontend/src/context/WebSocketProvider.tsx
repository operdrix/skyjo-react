import React, { useCallback, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WebSocketContext } from "@/context/WebSocketContext";

interface WebSocketProviderProps {
  children: React.ReactNode;
  url: string;
  enabled?: boolean; // Ajouter un flag pour contrôler si WebSocket doit se connecter
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url, enabled = true }) => {
  // Socket créé sans se connecter (la connexion est ouverte dans l'effet ci-dessous)
  const socket = useMemo<Socket | null>(
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
  const [loading, setLoading] = useState<boolean>(true); // Ajout de loading pour suivre l’état de connexion
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onConnect = () => {
      setIsConnected(true);
      setLoading(false); // La connexion est établie
      setError(null); // Réinitialiser l'erreur si la connexion est rétablie
    };
    const onDisconnect = () => {
      setIsConnected(false);
      setLoading(false); // Fin du chargement même en cas de déconnexion
      setError("Disconnected from WebSocket server");
    };
    const onConnectError = (err: Error) => {
      setError(`Connection error: ${err.message}`);
      setLoading(false); // Arrêter le chargement en cas d'erreur de connexion
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [socket]);

  const joinRoom = useCallback(
    (gameId: string) => {
      if (socket && isConnected) {
        socket.emit("join-room", gameId);
      }
    },
    [socket, isConnected],
  );

  const sendMessage = useCallback(
    (event: string, data: unknown) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        setError("Cannot send message: Socket is not connected.");
      }
    },
    [socket, isConnected],
  );

  const subscribeToEvent = useCallback(
    <T,>(event: string, callback: (data: T) => void) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    [socket],
  );

  const unsubscribeFromEvent = useCallback(
    <T,>(event: string, callback: (data: T) => void) => {
      if (socket) {
        socket.off(event, callback);
      }
    },
    [socket],
  );

  const reconnect = useCallback(() => {
    if (socket && !isConnected) {
      setLoading(true);
      socket.connect();
    }
  }, [socket, isConnected]);

  const disconnect = useCallback(() => {
    if (socket && isConnected) {
      socket.disconnect();
      setLoading(false); // Arrêter le chargement quand on se déconnecte explicitement
    }
  }, [socket, isConnected]);

  const subscribeToError = useCallback(
    (callback: (error: string) => void) => {
      if (error) {
        callback(error); // Appeler le callback avec l'erreur actuelle si elle existe
      }
    },
    [error],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      socket,
      isConnected,
      // Sans connexion demandée, rien n'est en cours de chargement
      loading: enabled && loading,
      error,
      joinRoom,
      sendMessage,
      subscribeToEvent,
      unsubscribeFromEvent,
      reconnect,
      disconnect,
      subscribeToError,
      clearError,
    }),
    [
      socket,
      isConnected,
      enabled,
      loading,
      error,
      joinRoom,
      sendMessage,
      subscribeToEvent,
      unsubscribeFromEvent,
      reconnect,
      disconnect,
      subscribeToError,
      clearError,
    ],
  );

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};
