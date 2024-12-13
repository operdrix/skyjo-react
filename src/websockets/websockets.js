import { getGame, updateGame } from "../controllers/games.js";

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
    const newGameData = checkGame(gameData);
    game.gameData = newGameData;
    await game.save();

    // Émettre l'événement à tous les membres de la room
    io.to(room).emit("play-move", gameData);
  });
}

// Fonction de vérification du jeu en cours
function checkGame(gameData) {
  // phase initialReveal
  if (gameData.currentStep === "initialReveal") {
    // Vérification que les joueurs ont révélé deux cartes

    if (allPlayersHaveTwoRevealed(gameData.playersCards, gameData.turnOrder)) {
      gameData.currentStep = "draw";
      gameData.currentPlayer = determineFirstPlayer(gameData);
    }
    return gameData;
  }

  // phase endTurn
  if (gameData.currentStep === "endTurn") {

    checkColumn(gameData);
    gameData.currentPlayer = nextPlayer(gameData);
    gameData.currentStep = "draw";
    return gameData;
  }

  return gameData;
}


// Fonction pour vérifier si une colonne contient les 3 mêmes cartes révélées
// Si c'est le cas, on retourne défausse les 3 cartes
function checkColumn(gameData) {
  for (const cards of Object.values(gameData.playersCards)) {
    //console.log("cards", cards);

    const offset = cards.length / 3;
    for (let i = 0; i < offset; i++) {
      const card1 = cards[i];
      const card2 = cards[i + offset];
      const card3 = cards[i + offset * 2];

      console.log("cards", cards);
      console.log("card1", card1.value);
      console.log("card2", card2.value);
      console.log("card3", card3.value);

      if (card1.revealed && card2.revealed && card3.revealed) {
        if (card1.value === card2.value && card2.value === card3.value) {
          gameData.discardPile.push(card1);
          gameData.discardPile.push(card2);
          gameData.discardPile.push(card3);

          // on retire les cartes de la main du joueur
          cards.splice(i, 1);
          cards.splice(i + offset - 1, 1);
          cards.splice(i + offset * 2 - 2, 1);
          return;
        }
      }
    }
  }
}

/**
 * Vérifie si tous les joueurs ont révélé 2 cartes
 * 
 * @param {*} playerCards 
 * @param {Array} turnOrder 
 * @returns 
 */
function allPlayersHaveTwoRevealed(playerCards, turnOrder) {
  for (const playerId of turnOrder) {
    const cards = playerCards[playerId] || [];
    const revealedCount = cards.reduce((count, card) => count + (card.revealed ? 1 : 0), 0);

    if (revealedCount < 2) {
      return false; // Si un seul joueur n'a pas 2 cartes révélées, on retourne false immédiatement.
    }
  }

  // Si on a passé la boucle sans retourner false, tous les joueurs ont 2 cartes révélées
  return true;
}

// Fonction pour passer au joueur suivant
// Si game.gameData.currentUser est null alors on prend le premier joueur de game.gameData.turnOrder
// Sinon on prend le joueur suivant dans game.gameData.turnOrder après game.gameData.currentUser
/**
 * 
 * @param {GameData} gameData 
 * @returns {string} playerId
 */
function nextPlayer(gameData) {
  const currentUserIndex = gameData.turnOrder.indexOf(gameData.currentPlayer);
  const nextPlayerIndex = (currentUserIndex + 1) % gameData.turnOrder.length;
  return gameData.turnOrder[nextPlayerIndex];
}

// Fonction pour déterminer quel joueur commence la partie
// On compte le total des valeurs des cartes révélées de chaque joueur
// Le joueur avec la valeur la plus haute commence
// En cas d'égalité, on prend le joueur avec la carte révélée la plus haute
/**
 * 
 * @param {GameData} gameData 
 * @returns {string} playerId
 */
function determineFirstPlayer(gameData) {
  let highestValue = 0;
  let highestPlayer = null;

  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId].filter(card => card.revealed);
    const totalValue = cards.reduce((total, card) => total + card.value, 0);
    console.log("totalValue", totalValue);

    if (totalValue > highestValue) {
      highestValue = totalValue;
      highestPlayer = playerId;
    } else if (totalValue === highestValue) {
      const highestCard = Math.max(...cards.map(card => card.value));
      const playerCards = gameData.playersCards[highestPlayer].filter(card => card.revealed);
      const highestPlayerCard = Math.max(...playerCards.map(card => card.value));

      if (highestCard > highestPlayerCard) {
        highestPlayer = playerId;
      }
    }
  }

  return highestPlayer;
}