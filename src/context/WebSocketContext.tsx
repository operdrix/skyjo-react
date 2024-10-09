// WebSocketContext.tsx
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: React.ReactNode;
    url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const socketInstance = io(url);

        socketInstance.on('validation', () => {
            console.log('Connected to WebSocket server');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        // Clean up when the component is unmounted
        return () => {
            socketInstance.disconnect();
        };
    }, [url]);

    const contextValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
};


