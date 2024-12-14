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

// Fonction de vérification du jeu en cours
async function checkGame(gameData) {

  // phase initialReveal
  // On attends que tous les joueurs aient révélé 2 cartes
  if (gameData.currentStep === "initialReveal") {
    // Vérification que les joueurs ont révélé deux cartes
    checkAllPlayersHaveTwoRevealed(gameData);
  }

  // phase endTurn
  // Après qu'un joueur ait joué,
  // - on vérifie si une colonne est complète
  // - on vérifie si c'est le dernier tour
  // - on vérifie si tous les joueurs ont révélé toutes leurs cartes
  if (gameData.currentStep === "endTurn") {

    checkColumn(gameData);

    checkLastTurn(gameData);

    checkEndGame(gameData);
  }

  return;
}

// Fonction pour compter le nombre de cartes non révélées d'un joueur
function countUnrevealedCards(cards) {
  return cards.reduce((count, card) => count + (card.revealed ? 0 : 1), 0);
}

// Fonction pour vérifier si tous les joueurs ont révélé toutes leurs cartes
function checkEndGame(gameData) {
  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId];
    if (countUnrevealedCards(cards) > 0) {
      nextPlayer(gameData);
      gameData.currentStep = "draw";
      return;
    }
  }
  gameData.currentStep = "endGame";
  return;
}

// fonction pour vérifier si on entre dans le dernier tour (au moins un joueur n'a plus de cartes non révélées)
function checkLastTurn(gameData) {
  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId];
    if (countUnrevealedCards(cards) === 0) {
      gameData.lastTurn = true;
      return;
    }
  }
  gameData.lastTurn = false;
  return;
}

// Fonction pour vérifier si une colonne contient les 3 mêmes cartes révélées
// Si c'est le cas, on défausse les 3 cartes
function checkColumn(gameData) {
  for (const cards of Object.values(gameData.playersCards)) {
    const offset = cards.length / 3;
    for (let i = 0; i < offset; i++) {
      const card1 = cards[i];
      const card2 = cards[i + offset];
      const card3 = cards[i + offset * 2];

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

function checkAllPlayersHaveTwoRevealed(gameData) {
  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId] || [];
    const revealedCount = cards.reduce((count, card) => count + (card.revealed ? 1 : 0), 0);

    if (revealedCount < 2) {
      return; // Si un seul joueur n'a pas 2 cartes révélées, on retourne false immédiatement.
    }
  }

  // Si on a passé la boucle sans retourner false, tous les joueurs ont 2 cartes révélées
  gameData.currentStep = "draw";
  determineFirstPlayer(gameData);
  return;
}

// Fonction pour passer au joueur suivant
function nextPlayer(gameData) {
  const currentUserIndex = gameData.turnOrder.indexOf(gameData.currentPlayer);
  const nextPlayerIndex = (currentUserIndex + 1) % gameData.turnOrder.length;
  gameData.currentPlayer = gameData.turnOrder[nextPlayerIndex];
  return;
}

// Fonction pour déterminer quel joueur commence la partie
// On compte le total des valeurs des cartes révélées de chaque joueur
// Le joueur avec la valeur la plus haute commence
// En cas d'égalité, on prend le joueur avec la carte révélée la plus haute
/**
 * 
 * @param {GameData} gameData 
 * @returns
 */
function determineFirstPlayer(gameData) {
  let highestValue = 0;
  let highestPlayer = null;

  for (const playerId of gameData.turnOrder) {
    const cards = gameData.playersCards[playerId].filter(card => card.revealed);
    const totalValue = cards.reduce((total, card) => total + card.value, 0);

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
  gameData.currentPlayer = highestPlayer;
  return;
}