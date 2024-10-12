export function joinRoom(socket) {
    socket.on("join-room", (gameId) => {
        socket.join(gameId);
        console.log("Joueur", socket.id, "a rejoint la room", gameId);
        socket.to(gameId).emit("player-joined-room", gameId);
    });
}