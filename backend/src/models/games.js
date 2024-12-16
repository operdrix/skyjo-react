import { DataTypes } from "@sequelize/core";
import { nanoid } from "nanoid";
import { sequelize } from "../bdd.js";
import User from "./users.js";

// Définition du modèle Game
const Game = sequelize.define("game", {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
		defaultValue: () => nanoid(5),
	},
	winnerScore: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	state: {
		type: DataTypes.ENUM("pending", "playing", "finished"),
		allowNull: false,
		defaultValue: "pending",
	},
	roundNumber: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	private: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	maxPlayers: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 4,
	},
	playersPlayAgain: {
		type: DataTypes.JSON,
		allowNull: false,
		defaultValue: [],
	},
	gameData: {
		type: DataTypes.JSON,
		allowNull: false,
		defaultValue: {},
	},
});

// Définition du modèle GamePlayers pour la relation de jointure
const GamePlayers = sequelize.define("game_players", {
	gameId: {
		type: DataTypes.STRING,
		references: {
			model: Game,
			key: "id"
		},
		allowNull: false,
	},
	userId: {
		type: DataTypes.STRING,
		references: {
			model: User,
			key: "id"
		},
		allowNull: false,
	},
	score: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	scoreByRound: {
		type: DataTypes.JSON,
		allowNull: false,
		defaultValue: [],
	},
	status: {
		type: DataTypes.ENUM("connected", "disconnected"),
		allowNull: false,
		defaultValue: "connected",
	},
});

// Relations
Game.belongsToMany(User, { through: GamePlayers, as: "players" });
User.belongsToMany(Game, { through: GamePlayers, as: "games" });

// Relation pour le créateur
Game.belongsTo(User, { foreignKey: "creator", as: "creatorPlayer" });
// Relation pour le gagnant
Game.belongsTo(User, { foreignKey: "winner", as: "winPlayer" });

export default Game;
export { GamePlayers };

