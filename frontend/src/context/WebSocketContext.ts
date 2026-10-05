import type { Socket } from "socket.io-client";
import { createContext } from "react";
import type {
  Ack,
  ClientEvent,
  ClientPayloads,
  ClientToServerEvents,
  ServerEvent,
  ServerToClientEvents,
} from "../../../shared/types";

export type GameClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Contexte seul : le provider est dans WebSocketProvider.tsx
export interface WebSocketContextType {
  socket: GameClientSocket | null;
  isConnected: boolean;
  loading: boolean;
  // Envoie un événement et renvoie l'accusé du serveur (un refus est déjà signalé au joueur)
  sendMessage: <E extends ClientEvent>(event: E, data: ClientPayloads[E]) => Promise<Ack>;
  subscribeToEvent: <E extends ServerEvent>(event: E, callback: ServerToClientEvents[E]) => void;
  unsubscribeFromEvent: <E extends ServerEvent>(event: E, callback: ServerToClientEvents[E]) => void;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);
