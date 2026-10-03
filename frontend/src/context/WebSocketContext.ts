import type { Socket } from "socket.io-client";
import { createContext } from "react";

// Contexte seul : le provider est dans WebSocketProvider.tsx
export interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  joinRoom: (room: string) => void;
  sendMessage: (event: string, data: unknown) => void;
  subscribeToEvent: <T>(event: string, callback: (data: T) => void) => void;
  unsubscribeFromEvent: <T>(event: string, callback: (data: T) => void) => void;
  reconnect: () => void;
  disconnect: () => void;
  subscribeToError: (callback: (error: string) => void) => void;
  clearError: () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);
