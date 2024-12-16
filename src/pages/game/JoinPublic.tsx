import { useWebSocket } from "@/hooks/WebSocket";
import { useEffect } from "react";

const JoinPublic = () => {
    const { socket, isConnected } = useWebSocket()
    useEffect(() => {
        if (socket && isConnected) {
            socket.on('message', (data) => {
                console.log('Received message:', data);
            });

            // Emit an event
            socket.emit('hello', { msg: 'Hello from client!' });
        }

        // Clean up on component unmount
        return () => {
            if (socket) {
                socket.off('message');
            }
        };
    }, [socket, isConnected]);
    return (
        <div>
            <h1>Join</h1>
            <h2>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</h2>
            <p>{isConnected && socket?.id}</p>
        </div>
    )
}

export default JoinPublic