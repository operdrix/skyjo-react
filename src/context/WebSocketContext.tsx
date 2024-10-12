/* eslint-disable @typescript-eslint/no-explicit-any */
// WebSocketContext.tsx
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    loading: boolean;
    error: string | null;
    joinRoom: (room: string) => void;
    sendMessage: (event: string, data: any) => void;
    subscribeToEvent: (event: string, callback: (data: any) => void) => void;
    unsubscribeFromEvent: (event: string, callback: (data: any) => void) => void;
    reconnect: () => void;
    disconnect: () => void;
    subscribeToError: (callback: (error: string) => void) => void;
    clearError: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: React.ReactNode;
    url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true); // Ajout de loading pour suivre l’état de connexion
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socketInstance = io(url);

        setLoading(true); // La connexion commence

        socketInstance.on('connect', () => {
            console.log('Connected to WebSocket server');
            setIsConnected(true);
            setLoading(false); // La connexion est établie
            setError(null);    // Réinitialiser l'erreur si la connexion est rétablie
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setIsConnected(false);
            setLoading(false); // Fin du chargement même en cas de déconnexion
            setError('Disconnected from WebSocket server');
        });

        socketInstance.on('connect_error', (err: any) => {
            console.error('Connection error:', err.message);
            setError(`Connection error: ${err.message}`);
            setLoading(false); // Arrêter le chargement en cas d’erreur de connexion
        });

        setSocket(socketInstance);

        // Clean up on unmount
        return () => {
            socketInstance.disconnect();
        };
    }, [url]);

    const joinRoom = useCallback((gameId: string) => {
        if (socket && isConnected) {
            socket.emit('join-room', gameId);
        }
    }, [socket, isConnected]);

    const sendMessage = useCallback((event: string, data: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            console.warn('Socket is not connected.');
            setError('Cannot send message: Socket is not connected.');
        }
    }, [socket, isConnected]);

    const subscribeToEvent = useCallback((event: string, callback: (data: any) => void) => {
        if (socket) {
            socket.on(event, callback);
        }
    }, [socket]);

    const unsubscribeFromEvent = useCallback((event: string, callback: (data: any) => void) => {
        if (socket) {
            socket.off(event, callback);
        }
    }, [socket]);

    const reconnect = useCallback(() => {
        if (socket && !isConnected) {
            setLoading(true); // Démarrer le chargement lors de la reconnexion
            socket.connect();
        }
    }, [socket, isConnected]);

    const disconnect = useCallback(() => {
        if (socket && isConnected) {
            socket.disconnect();
            setLoading(false); // Arrêter le chargement quand on se déconnecte explicitement
        }
    }, [socket, isConnected]);

    const subscribeToError = useCallback((callback: (error: string) => void) => {
        if (error) {
            callback(error); // Appeler le callback avec l'erreur actuelle si elle existe
        }
    }, [error]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const contextValue = useMemo(() => ({
        socket,
        isConnected,
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
    }), [socket, isConnected, loading, error, joinRoom, sendMessage, subscribeToEvent, unsubscribeFromEvent, reconnect, disconnect, subscribeToError, clearError]);

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
};
