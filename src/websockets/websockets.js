import { getGame, updateGame } from "../controllers/games.js";
import { joinRoom } from "./room/joinRoom.js";
export function websockets(app) {
    app.io.on("connection", (socket) => {
        console.log(`Joueur connecté : ${socket.id}`);

        joinRoom(socket);

        playerJoinedGame(socket);

        socket.on("disconnect", () => {
            console.log(`Joueur déconnecté : ${socket.id}`);
        });
    });
}

function playerJoinedGame(socket) {
    socket.on("player-joined-game", async ({ room, userId }) => {
        console.log("player-joined-game", room, userId);
        updateGame({ params: { action: "join", gameId: room }, body: { userId } });
        const game = await getGame(room);
        if (!game) {
            return;
        }
        socket.join(room);
        setTimeout(() => {
            socket.to(room).emit("player-joined-game", game);
        }, 1000);
    });
}