import Game from "../models/games.js";
import User from "../models/users.js";

interface GameQuery {
  userId?: string;
  state?: string;
  privateRoom?: string;
  creatorId?: string;
}

interface GameRequest {
  params: {
    action: string;
    gameId: string;
  };
  body: {
    userId?: string;
    winnerScore?: number;
    winner?: string;
    [key: string]: any;
  } | null;
}

interface GameSettings {
  maxPlayers?: number;
  private?: boolean;
  [key: string]: any;
}

interface GameData {
  players: {
    id: string;
    name: string;
    cards: Array<{
      value: number;
      revealed: boolean;
      position: number;
    }>;
    ready: boolean;
    score: number;
    lastCard?: {
      value: number;
      position: number;
    };
  }[];
  currentPlayer: string;
  deck: number[];
  discardPile: number[];
  lastTurn: boolean;
  round: number;
  [key: string]: any;
}

// Liste des parties avec filtres
export async function getGames(query: GameQuery): Promise<Express.Game[]> {
  const { userId, state, privateRoom, creatorId } = query;

  const where: any = {};
  if (state) {
    where.state = state;
  }
  if (privateRoom) {
    where.private = privateRoom === 'true' ? true : false;
  }
  if (creatorId) {
    where['$players.id$'] = creatorId;
  }

  const games = await Game.findAll({
    where,
    include: [
      {
        model: User,
        as: "players",
        where: userId ? { id: userId } : undefined,
        attributes: ["id", "username"]
      },
      {
        model: User,
        as: "creatorPlayer",
        attributes: ["id", "username"]
      }
    ]
  }) as unknown as Express.Game[];

  if (userId) {
    return games.filter(game => game.players.some(player => player.id === userId));
  }

  return games;
}

// liste des parties d'un User
export async function getUserGames(userId: string): Promise<Express.Game[] | { error: string; code: number }> {
  try {
    // Récupérer l'utilisateur avec la liste des games associées
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Game,
          as: "games",
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
    }) as unknown as Express.User;

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
export async function deleteGame(gameId: string, userId: string): Promise<{ gameDestroyed: boolean } | { error: string; code: number }> {
  const game = await Game.findByPk(gameId) as unknown as Express.Game;

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
export async function getGame(gameId: string): Promise<Express.Game | { error: string; code: number }> {
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
  }) as unknown as Express.Game;

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }
  return game;
}

// Créer une nouvelle partie
export async function createGame(userId: string, privateRoom: boolean): Promise<{ gameId: string } | { error: string; code: number }> {
  if (!userId) {
    return { error: "L'identifiant du créateur est manquant", code: 400 };
  }
  // Création de la partie
  const game = await Game.create({
    status: "waiting",
    private: privateRoom,
    creator: userId,
    name: "Nouvelle partie",
    roundNumber: 0,
    maxPlayers: 4,
    playersPlayAgain: [],
    gameData: {}
  }) as unknown as Express.Game;

  console.log("[game controller] ID de la partie créée :", game.id);

  // Ajouter le créateur comme premier joueur
  await game.addPlayer(userId);

  return { gameId: game.id };
}

// Mettre à jour une partie (joindre, démarrer, terminer)
export async function updateGame(request: GameRequest): Promise<Express.Game | { error: string; code: number } | { gameDestroyed: boolean }> {
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
  }) as unknown as Express.Game;

  if (!game) {
    console.log("[game controller] Game not found");
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (game.status === "finished") {
    console.log("[game controller] Game is already finished");
    return { error: "Cette partie est déjà terminée !", code: 400 };
  }

  switch (action) {
    case "join":
      if (game.status !== "waiting") {
        const player = game.players.find(player => player.id === userId);
        if (player && player.game_players) {
          player.game_players.status = "connected";
          await player.game_players.save();
        }
      } else {
        if (game.players.length >= game.maxPlayers) {
          console.log("[game controller] Game is full");
          return { error: `Cette partie est déjà complète avec ${game.maxPlayers} joueurs !`, code: 400 };
        }
        if (game.players.some(player => player.id === userId)) {
          console.log("[game controller] Player already in game");
          return { error: "Vous êtes déjà dans cette partie.", code: 400 };
        }
        console.log("[game controller] addPlayer ", userId);
        try {
          if (userId) {
            await game.addPlayer(userId);
          }
        } catch (error) {
          console.error("Error adding player to game:", error);
          return { error: "Impossible de rejoindre la partie.", code: 500 };
        }
      }
      break;

    case "leave":
      console.log("[game controller] player leaded ", userId);

      if (game.status === "waiting") {
        if (userId) {
          await game.removePlayer(userId);
          // Supprimer la partie si le créateur la quitte ou si tous les joueurs la quittent
          if (game.creator === userId || game.players.length === 0) {
            // await game.destroy();
            // return { gameDestroyed: true };
          }
        }
      } else {
        // Marquer le joueur comme déconnecté
        const player = game.players.find(player => player.id === userId);
        if (player && player.game_players) {
          player.game_players.status = "disconnected";
          await player.game_players.save();
        }
      }
      break;

    case "start":
      game.status = "playing";
      game.roundNumber = game.roundNumber + 1;
      // La fonction dealCards sera implémentée plus tard
      game.gameData = await dealCards(gameId);
      break;

    case "finish":
      console.log("[game controller] finish game");

      if (!request.body || !request.body.winnerScore || !request.body.winner) {
        return { error: "Le score et le gagnant doivent être fournis.", code: 400 };
      }

      game.status = "finished";
      game.winnerScore = request.body.winnerScore;
      game.winner = request.body.winner;
      break;

    default:
      console.log("Unknown action");
      return { error: "Action inconnue", code: 400 };
  }

  await game.save();
  return game as Express.Game;
}

// Mettre à jour les paramètres de la partie
export async function updateGameSettings(gameId: string, settings: GameSettings): Promise<Express.Game | { error: string; code: number }> {
  const game = await Game.findByPk(gameId) as unknown as Express.Game;

  if (!game) {
    return { error: "La partie n'existe pas.", code: 404 };
  }

  if (settings.maxPlayers && typeof settings.maxPlayers === 'number') {
    game.maxPlayers = settings.maxPlayers;
  }

  if (settings.private !== undefined) {
    game.private = settings.private;
  }

  await game.save();
  return game;
}

// Distribuer les cartes pour une nouvelle partie
export async function dealCards(gameId: string): Promise<GameData> {
  // Implémentation simplifiée pour l'exemple
  // Cette fonction sera complétée avec la logique réelle du jeu
  const game = await Game.findByPk(gameId, {
    include: [
      {
        model: User,
        as: "players",
        attributes: ["id", "username"]
      }
    ]
  }) as unknown as Express.Game;

  if (!game) {
    throw new Error("Game not found");
  }

  // Créer un jeu de cartes
  const deck = Array.from({ length: 80 }, (_, i) => i % 20 - 10); // Valeurs de -10 à 9

  // Mélanger le jeu
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Préparer les données du jeu
  const gameData: GameData = {
    players: [],
    currentPlayer: '',
    deck: deck.slice(game.players.length * 12), // Reste du deck après distribution
    discardPile: [deck[0]], // Première carte sur la pile de défausse
    lastTurn: false,
    round: 1
  };

  // Distribuer les cartes aux joueurs
  game.players.forEach((player: Express.UserWithGamePlayer, index: number) => {
    const playerCards = deck.slice(index * 12, (index + 1) * 12);

    gameData.players.push({
      id: player.id,
      name: player.username,
      cards: playerCards.map((value, position) => ({
        value,
        revealed: false,
        position
      })),
      ready: false,
      score: 0
    });
  });

  // Déterminer le premier joueur
  gameData.currentPlayer = gameData.players[0].id;

  return gameData;
}

export async function checkGame(game: Express.Game): Promise<Express.Game> {
  // Cette fonction implémentera la logique de vérification de l'état du jeu
  return game;
} 