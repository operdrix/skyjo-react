import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../../../shared/types.ts";

// Données attachées au socket après authentification
export type SocketData = { userId: string; username: string; room?: string };

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
