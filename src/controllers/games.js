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
        return { error: "L'identifiant du créateur est manquant" };
    }
    // Création de la partie
    const game = await Game.create({
        state: "pending",
        private: privateRoom,
        creator: userId
    });
    console.log("ID de la partie créée :", game.id);

    // Ajouter le créateur comme premier joueur
    await game.addPlayer(userId);

    return { gameId: game.id };
}

// Mettre à jour une partie (joindre, démarrer, terminer)
export async function updateGame(request) {
    console.log("updateGame");

    const { action, gameId } = request.params;
    const userId = request.body.userId;

    if (!userId) {
        return { error: "L'identifiant du joueur est manquant" };
    }

    // Rechercher la partie
    const game = await Game.findByPk(gameId, {
        include: [{ model: User, as: "players" }]
    });

    if (!game) {
        return { error: "La partie n'existe pas." };
    }

    if (game.state === "finished") {
        return { error: "Cette partie est déjà terminée !" };
    }

    switch (action) {
        case "join":
            if (game.players.length >= 4) {
                return { error: "Cette partie est déjà complète avec 4 joueurs !" };
            }
            if (game.players.some(player => player.id === userId)) {
                return { error: "Vous êtes déjà dans cette partie." };
            }

            await game.addPlayer(userId);
            break;

        case "start":
            if (game.state !== "pending") {
                return { error: "La partie a déjà commencé." };
            }

            game.state = "playing";
            break;

        case "finish":
            if (!request.body.score || !request.body.winner) {
                return { error: "Le score et le gagnant doivent être fournis." };
            }

            game.state = "finished";
            game.winnerScore = request.body.score;
            game.winner = request.body.winner;
            break;

        default:
            return { error: "Action inconnue" };
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