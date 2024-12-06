import { getGame, updateGame } from "../controllers/games.js";
import { joinRoom } from "./room/joinRoom.js";

export function websockets(app) {
  app.ready().then(() => {
    app.io.on("connection", (socket) => {
      console.log(`Joueur connecté : ${socket.id}`);

      joinRoom(socket);

      playerJoinedGame(socket, app.io);

      socket.on("disconnect", () => {
        console.log(`Joueur déconnecté : ${socket.id}`);
      });
    });
  });
}

// un joueur rejoint une partie
// on envoie à tous les joueurs de la partie les informations de la partie
function playerJoinedGame(socket, io) {

  socket.on("player-joined-game", async ({ room, userId }) => {
    console.log("player-joined-game", room, userId);

    updateGame({ params: { action: "join", gameId: room }, body: { userId } });

    const game = await getGame(room);
    if (!game) {
      console.error("Game not found for room:", room);
      return;
    }

    // Ajouter le socket à la room
    socket.join(room);

    // Émettre l'événement à tous les membres de la room
    io.to(room).emit("player-joined-game", game);
  });

}

