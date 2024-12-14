import Game from "../models/games.js";
import User from "../models/users.js";

// Consulter une partie
export async function getGame(gameId) {
  const game = await Game.findByPk(gameId, {
    include: [
      {
        model: User,
        as: "players",
        attributes: ["id", "username"]
      },
      {
        model: User,
        as: "creatorPlayer",
        attributes: ["id", "username"]
      }
    ]
  });

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }
  return game;
}

// Créer une nouvelle partie
export async function createGame(userId, privateRoom) {
  if (!userId) {
    return { error: "L'identifiant du créateur est manquant", code: 400 };
  }
  // Création de la partie
  const game = await Game.create({
    state: "pending",
    private: privateRoom,
    creator: userId
  });
  console.log("[game controller] ID de la partie créée :", game.id);

  // Ajouter le créateur comme premier joueur
  await game.addPlayer(userId);

  return { gameId: game.id };
}

// Mettre à jour une partie (joindre, démarrer, terminer)
export async function updateGame(request) {
  const { action, gameId } = request.params;
  const userId = request.body ? request.body.userId : null;

  console.log(`Update game ${gameId} with action ${action} for user ${userId}`);

  if ((action === "join" || action === "leave") && !userId) {
    console.log("[game controller] User ID is missing");
    return { error: "L'identifiant du joueur est manquant", code: 400 };
  }

  // Rechercher la partie
  const game = await Game.findByPk(gameId, {
    include: [{ model: User, as: "players" }]
  });

  if (!game) {
    console.log("[game controller] Game not found");
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.state === "finished") {
    console.log("[game controller] Game is already finished");
    return { error: "Cette partie est déjà terminée !", code: 400 };
  }

  switch (action) {
    case "join":
      if (game.state !== "pending") {
        const player = game.players.find(player => player.id === userId);
        if (player) {
          player.game_players.status = "connected";
          await player.game_players.save();
        }
      } else {
        if (game.players.length >= game.maxPlayers) {
          console.log("[game controller] Game is full");
          return { error: `Cette partie est déjà complète avec ${game.maxPlayers} joueurs !` };
        }
        if (game.players.some(player => player.id === userId)) {
          console.log("[game controller] Player already in game");
          return { error: "Vous êtes déjà dans cette partie.", code: 400 };
        }
        console.log("[game controller] addPlayer ", userId);
        try {
          await game.addPlayer(userId);
        } catch (error) {
          console.error("Error adding player to game:", error);
          return { error: "Impossible de rejoindre la partie.", code: 500 };
        }
      }
      break;

    case "leave":
      console.log("[game controller] player leaded ", userId);

      if (game.state === "pending") {
        await game.removePlayer(userId);
        // Supprimer la partie si le créateur la quitte ou si tous les joueurs la quittent
        if (game.creator === userId || game.players.length === 0) {
          console.log("[game controller] destroy game");
          await game.destroy();
          return { gameDestroyed: true };
        }
      } else {
        // Marquer le joueur comme déconnecté
        const player = game.players.find(player => player.id === userId);
        if (player) {
          player.game_players.status = "disconnected";
          await player.game_players.save();
        }
      }
      break;

    case "start":
      // if (game.state !== "pending") {
      //   return { error: "La partie a déjà commencé.", code: 400 };
      // }

      game.state = "playing";
      game.roundNumber = game.roundNumber + 1;
      game.gameData = await dealCards(gameId);
      break;

    case "finish":
      console.log("[game controller] finish game");

      if (!request.body.winnerScore || !request.body.winner) {
        return { error: "Le score et le gagnant doivent être fournis.", code: 400 };
      }

      game.state = "finished";
      game.winnerScore = request.body.winnerScore;
      game.winner = request.body.winner;
      break;

    default:
      console.log("Unknown action");
      return { error: "Action inconnue", code: 400 };
  }

  await game.save();
  return game;
}

// Mettre à jour les paramètres d'une partie
export async function updateGameSettings(gameId, settings) {
  const game = await Game.findByPk(gameId);

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.state !== "pending") {
    return { error: "Impossible de modifier les paramètres d'une partie en cours.", code: 403 };
  }

  await game.update(settings);
  return game;
}

// Distribuer les cartes aux joueurs
export async function dealCards(gameId) {
  const game = await Game.findByPk(gameId, {
    include: [{ model: User, as: "players" }]
  });

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.players.length === 0) {
    return { error: "Aucun joueur dans la partie.", code: 400 };
  }

  // Set de cartes du skyjo (5 cartes -2, 10 cartes -1, 15 cartes 0 et 10 cartes de chaque de 1 à 12)
  const cards = []
  // ajout des cartes -2
  for (let i = 0; i < 5; i++) {
    cards.push({ id: 'card_' + cards.length, value: -2, color: 'negative', revealed: false, onHand: false });
  }
  // ajout des cartes -1
  for (let i = 0; i < 10; i++) {
    cards.push({ id: 'card_' + cards.length, value: -1, color: 'negative', revealed: false, onHand: false });
  }
  // ajout des cartes 0
  for (let i = 0; i < 15; i++) {
    cards.push({ id: 'card_' + cards.length, value: 0, color: 'zero', revealed: false, onHand: false });
  }
  // ajout des cartes de 1 à 4
  for (let i = 1; i <= 4; i++) {
    for (let j = 0; j < 10; j++) {
      cards.push({ id: 'card_' + cards.length, value: i, color: 'green', revealed: false, onHand: false });
    }
  }
  // ajout des cartes de 5 à 8
  for (let i = 5; i <= 8; i++) {
    for (let j = 0; j < 10; j++) {
      cards.push({ id: 'card_' + cards.length, value: i, color: 'yellow', revealed: false, onHand: false });
    }
  }
  // ajout des cartes de 9 à 12
  for (let i = 9; i <= 12; i++) {
    for (let j = 0; j < 10; j++) {
      cards.push({ id: 'card_' + cards.length, value: i, color: 'red', revealed: false, onHand: false });
    }
  }

  // Mélanger les cartes plusieurs fois
  cards.sort(() => Math.random() - 0.5);
  cards.sort(() => Math.random() - 0.5);
  cards.sort(() => Math.random() - 0.5);
  cards.sort(() => Math.random() - 0.5);

  // Distribuer les cartes aux joueurs
  const playersCards = {};
  for (const player of game.players) {
    playersCards[player.id] = [];
    for (let i = 0; i < 12; i++) {
      playersCards[player.id].push(cards.pop());
    }
  }

  // On retourne la première carte de la pioche qu'on met dans la défausse
  const firstCard = cards.pop();
  firstCard.revealed = true;

  // On retourne un objet avec les cartes par joueurs, les cartes dans la pioche et les cartes défaussées
  return {
    playersCards,
    deckCards: cards,
    discardPile: [firstCard],
    currentPlayer: null,
    currentStep: "initialReveal", // draw, decide, replace, flip, endTurn, endGame
    turnOrder: game.players.map(player => player.id),
    lastTurn: false,
    firstPlayerToEnd: null
  };
}

// Fonction de vérification du jeu en cours
export async function checkGame(game) {

  const gameData = game.gameData;

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

    if (gameData.lastTurn) {
      revealAllCards(gameData, gameData.currentPlayer);
    }

    checkEndGame(gameData);
  }

  // Fin de la manche
  if (gameData.currentStep === "endGame") {

    // Sauvegarde des scores
    await saveScore(game);

    // Vérification du score maximum
    await checkMaximumScore(game);

    if (game.state === "finished") {
      io.to(room).emit("finished", game);
      return;
    }
  }

  return;
}

function revealAllCards(gameData, playerId) {
  const cards = gameData.playersCards[playerId];
  for (const card of cards) {
    card.revealed = true;
  }
}

async function saveScore(game) {
  const gameData = game.gameData;
  if (!gameData) return;
  if (gameData.currentStep !== "endGame") return;

  const playerScores = [];
  const firstPlayerToEnd = gameData.firstPlayerToEnd;
  let firstPlayerToEndScore = 0;

  const countPoints = (cards) => {
    return cards.reduce((total, card) => total + card.value, 0);
  }

  // on parcours les joueurs pour enregistrer leur score
  for (const player of game.players) {
    const cards = gameData.playersCards[player.id];
    const score = countPoints(cards);
    const currentScore = player.game_players.score || 0;
    const roundsScores = [...(player.game_players.scoreByRound || [])];

    // on enregistre les scores des joueurs sauf celui qui a terminé en premier
    if (player.id !== firstPlayerToEnd) {
      playerScores.push(score);
    } else {
      firstPlayerToEndScore = score;
    }

    roundsScores.push(score);

    player.game_players.score = currentScore + score;
    player.game_players.scoreByRound = roundsScores;

    await player.game_players.save();
  }

  // on vérifie si le score du joueur qui a terminé en premier est inférieur à celui des autres joueurs
  // Sinon on double son score
  if (firstPlayerToEndScore >= Math.min(...playerScores)) {
    const player = game.players.find(player => player.id === firstPlayerToEnd);
    const currentTotalScore = player.game_players.score || 0;
    const lastScore = player.game_players.scoreByRound.pop();
    player.game_players.score = currentTotalScore + lastScore;
    player.game_players.scoreByRound = [...player.game_players.scoreByRound, lastScore * 2];

    await player.game_players.save();
  }

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
      gameData.firstPlayerToEnd = gameData.firstPlayerToEnd === null ? playerId : gameData.firstPlayerToEnd;
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

// Fonction qui vérifie si un joueur a au moins 100 points dans son score
async function checkMaximumScore(game) {

  let finished = false;
  let winnerScore = 0;
  let winner = null;

  for (const player of game.players) {
    if (player.game_players.score >= 100) {
      finished = true;
    }
    if (player.game_players.score < winnerScore || winnerScore === 0) {
      winnerScore = player.game_players.score;
      winner = player.game_players.userId;
    }
  }

  if (finished) {
    //await updateGame({ params: { action: "finish", gameId: game.id }, body: { winner, winnerScore } });
    game.state = "finished";
    game.winner = winner;
    game.winnerScore = winnerScore;
  }
}