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
      if (game.state !== "pending") {
        return { error: "La partie a déjà commencé.", code: 400 };
      }

      game.state = "playing";
      break;

    case "finish":
      if (!request.body.score || !request.body.winner) {
        return { error: "Le score et le gagnant doivent être fournis.", code: 400 };
      }

      game.state = "finished";
      game.winnerScore = request.body.score;
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