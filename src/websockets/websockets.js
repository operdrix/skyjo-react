import { checkGame, getGame, updateGame } from "../controllers/games.js";

export async function websockets(app) {
  await app.ready();
  // Lorsqu'un joueur se connecte
  app.io.on("connection", (socket) => {
    console.log(`Joueur connecté : ${socket.id} room: ${socket.room}`);

    // Ecoute des événements socket
    playerJoinedGame(socket, app.io);
    gameSettingsChanged(socket, app.io);
    startGame(socket, app.io);
    playMove(socket, app.io);

    // Lorsqu'un joueur se déconnecte
    socket.on("disconnect", async () => {
      console.log(`Joueur déconnecté : ${socket.id} room: ${socket.room}`);
      // Si le joueur est dans une partie, le retirer de la partie
      await playerLeftGame(socket.room, socket.userId, app.io);
    });
  });
}

// un joueur rejoint une partie
// on envoie à tous les joueurs de la partie les informations de la partie
function playerJoinedGame(socket, io) {

  socket.on("player-joined-game", async ({ room, userId }) => {

    // attente d'un délai pour éviter les problèmes de concurrence
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let game = null;
    game = await getGame(room);
    if (!game) {
      console.error("Game not found for room:", room);
      return;
    }

    if (game.state !== "pending") {
      await updateGame({ params: { action: "join", gameId: room }, body: { userId } });
      game = await getGame(room);
    }

    // Ajouter le socket à la room
    socket.join(room);
    socket.room = room;
    socket.userId = userId;

    console.log("(player-joined-game) room:", room, "userId:", userId);

    // Émettre l'événement à tous les membres de la room
    io.to(room).emit("player-joined-game", game);
  });

}

// un joueur quitte une partie
// on envoie à tous les joueurs de la partie les informations de la partie
export async function playerLeftGame(room, userId, io) {
  await updateGame({ params: { action: "leave", gameId: room }, body: { userId } });

  const game = await getGame(room);
  if (!game) {
    console.error("Game not found for room:", room);
    return;
  }

  // Émettre l'événement à tous les membres de la room
  io.to(room).emit("player-left-game", game);
}

// les paramètres de la partie ont changé
// on envoie à tous les joueurs de la partie les informations de la partie
export async function gameSettingsChanged(socket, io) {
  socket.on("update-game-params", async ({ room }) => {
    console.log("update-game-params", room);

    const game = await getGame(room);
    if (!game) {
      console.error("Game not found for room:", room);
      return;
    }

    // Émettre l'événement à tous les membres de la room
    io.to(room).emit("update-game-params", game);
  });
}

// Démarrer une partie
// on envoie à tous les joueurs de la partie les informations de la partie
export async function startGame(socket, io) {
  socket.on("start-game", async ({ room }) => {
    console.log("start-game", room);
    await updateGame({ params: { action: "start", gameId: room } });

    const game = await getGame(room);
    if (!game) {
      console.error("Game not found for room:", room);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Émettre l'événement à tous les membres de la room
    io.to(room).emit("start-game", game);
  });
}

// Un coup est joué
export async function playMove(socket, io) {
  socket.on("play-move", async ({ room, gameData }) => {
    console.log("play-move", room, gameData.currentStep);

    const game = await getGame(room);
    if (!game) {
      console.error("Game not found for room:", room);
      return;
    }

    checkGame(gameData);
    await game.update({ gameData });

    // Fin de la manche
    if (gameData.currentStep === "endGame") {
      await updateGame({ params: { action: "saveScore", gameId: room }, body: { gameData } });
    }

    // Émettre l'événement à tous les membres de la room
    io.to(room).emit("play-move", gameData);
  });
}