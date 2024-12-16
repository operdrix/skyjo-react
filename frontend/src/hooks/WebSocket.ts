import { WebSocketContext, WebSocketContextType } from "@/context/WebSocketContext";
import { useContext } from "react";

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};