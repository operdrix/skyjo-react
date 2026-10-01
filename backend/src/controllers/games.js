import { sequelize } from "../bdd.js";
import Game from "../models/games.js";
import User from "../models/users.js";
import * as rules from "../game/rules.js";
import { logger } from "../utils/logger.js";

// Seuls attributs de joueur exposés dans les réponses de partie
const PUBLIC_USER_ATTRIBUTES = ["id", "username"];

// Liste des parties avec filtres
export async function getGames(query) {
  const { userId, state, privateRoom, creatorId } = query;

  const where = {};
  if (state) {
    where.state = state;
  }
  if (privateRoom) {
    where.private = privateRoom === "true" ? true : false;
  }
  if (creatorId) {
    where["$players.id$"] = creatorId;
  }
  const games = await Game.findAll({
    where,
    include: [
      {
        model: User,
        as: "players",
        where: userId ? { id: userId } : null,
        attributes: ["id", "username"]
      },
      {
        model: User,
        as: "creatorPlayer",
        attributes: ["id", "username"]
      }
    ]
  });

  if (userId) {
    return games.filter(game => game.players.some(player => player.id === userId));
  }

  return games;
}

// liste des parties d'un User
export async function getUserGames(userId) {
  try {
    // Récupérer l'utilisateur avec la liste des games associées
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Game,
          as: "games",
          // On peut choisir les attributs qu'on veut renvoyer
          // attributes: ["id", "state", "private", "roundNumber", ...],
          // Ou tout renvoyer
          attributes: { exclude: ["gameData"] },
          // Pour ne pas inclure les colonnes de la table pivot (game_players)
          through: { attributes: [] },
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

        }
      ]
    });

    if (!user) {
      return { error: "L'utilisateur n'existe pas.", code: 404 };
    }

    // user.games contient toutes les parties
    return user.games;

  } catch (error) {
    console.error("Erreur lors de la récupération des parties du joueur :", error);
    return { error: "Impossible de récupérer les parties du joueur.", code: 500 };
  }
}

// Supprimer une partie
export async function deleteGame(gameId, userId) {
  const game = await Game.findByPk(gameId);

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.creator !== userId) {
    return { error: "Seul le créateur de la partie peut la supprimer.", code: 403 };
  }

  await game.destroy();
  return { gameDestroyed: true };
}

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

  // Verrou sur la partie : join, leave et start ne s'entrelacent pas
  // (sinon un joueur retiré pendant le démarrage garde des cartes)
  return sequelize.transaction(async (transaction) => {
    const locked = await Game.findByPk(gameId, { transaction, lock: true });
    if (!locked) {
      console.log("[game controller] Game not found");
      return { error: "La partie n'existe pas.", code: 404 };
    }
    const game = await Game.findByPk(gameId, {
      include: [{ model: User, as: "players", attributes: PUBLIC_USER_ATTRIBUTES }],
      transaction,
    });
    return applyGameAction(game, action, userId, request.body, transaction);
  });
}

async function applyGameAction(game, action, userId, body, transaction) {
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
          await player.game_players.save({ transaction });
        }
      } else {
        if (game.players.length >= game.maxPlayers) {
          logger.debug("[game controller] Game is full");
          return { error: `Cette partie est déjà complète avec ${game.maxPlayers} joueurs !` };
        }
        if (game.players.some(player => player.id === userId)) {
          logger.debug("[game controller] Player already in game");
          return { error: "Vous êtes déjà dans cette partie.", code: 400 };
        }
        logger.debug("[game controller] addPlayer ", userId);
        try {
          await game.addPlayer(userId, { transaction });
        } catch (error) {
          logger.error("Error adding player to game:", error);
          return { error: "Impossible de rejoindre la partie.", code: 500 };
        }
      }
      break;

    case "leave":
      logger.debug("[game controller] player leaded ", userId);

      if (game.state === "pending") {
        await game.removePlayer(userId, { transaction });
        // Supprimer la partie si le créateur la quitte ou si tous les joueurs la quittent
        if (game.creator === userId || game.players.length === 0) {
          // console.log("[game controller] destroy game");
          //await game.destroy();
          // return { gameDestroyed: true };
        }
      } else {
        // Marquer le joueur comme déconnecté
        const player = game.players.find(player => player.id === userId);
        if (player) {
          player.game_players.status = "disconnected";
          await player.game_players.save({ transaction });
        }
      }
      break;

    case "start":
      // if (game.state !== "pending") {
      //   return { error: "La partie a déjà commencé.", code: 400 };
      // }

      game.state = "playing";
      game.roundNumber = game.roundNumber + 1;
      game.gameData = rules.dealCards(game.players.map(player => player.id));
      break;

    case "finish":
      logger.debug("[game controller] finish game");

      if (!body.winnerScore || !body.winner) {
        return { error: "Le score et le gagnant doivent être fournis.", code: 400 };
      }

      game.state = "finished";
      game.winnerScore = body.winnerScore;
      game.winner = body.winner;
      break;

    default:
      logger.warn("Unknown action");
      return { error: "Action inconnue", code: 400 };
  }

  await game.save({ transaction });
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

// Fait avancer la partie après un coup ; en fin de manche, enregistre les scores
// et termine la partie si un joueur atteint le score maximum
export async function checkGame(game) {
  const gameData = game.gameData;

  rules.advanceGame(gameData);

  if (gameData.currentStep === "endGame") {
    await saveScore(game);

    const totals = Object.fromEntries(game.players.map(player => [player.id, player.game_players.score]));
    const { finished, winner, winnerScore } = rules.checkMaximumScore(totals);
    if (finished) {
      game.state = "finished";
      game.winner = winner;
      game.winnerScore = winnerScore;
    }
  }
}

async function saveScore(game) {
  const roundScores = rules.computeRoundScores(game.gameData);

  for (const player of game.players) {
    const score = roundScores[player.id] ?? 0;
    player.game_players.score = (player.game_players.score || 0) + score;
    player.game_players.scoreByRound = [...(player.game_players.scoreByRound || []), score];
    await player.game_players.save();
  }
}
