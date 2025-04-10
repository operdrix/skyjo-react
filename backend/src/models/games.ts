import { nanoid } from "nanoid";
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../bdd.js";
import { GameAttributes } from "../types/index.js";
import User from "./users.js";

interface GameCreationAttributes extends Optional<GameAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

// Définition du modèle Game
class Game extends Model<GameAttributes, GameCreationAttributes> {
  declare id: string;
  declare name: string;
  declare winnerScore: number | null;
  declare status: 'waiting' | 'playing' | 'finished';
  declare roundNumber: number;
  declare private: boolean;
  declare maxPlayers: number;
  declare playersPlayAgain: string[];
  declare gameData: Record<string, any>;
  declare currentPlayerId: string | null;
  declare creator: string;
  declare winner: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

// Interface pour la relation de jointure GamePlayers
export interface GamePlayersAttributes {
  gameId: string;
  userId: string;
  score: number;
  scoreByRound: number[];
  status: 'connected' | 'disconnected';
  createdAt: Date;
  updatedAt: Date;
}

class GamePlayers extends Model<GamePlayersAttributes> {
  declare gameId: string;
  declare userId: string;
  declare score: number;
  declare scoreByRound: number[];
  declare status: 'connected' | 'disconnected';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Game.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: () => nanoid(5),
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Nouvelle partie",
    },
    winnerScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("waiting", "playing", "finished"),
      allowNull: false,
      defaultValue: "waiting",
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
    currentPlayerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    creator: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    winner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'game',
    timestamps: true
  }
);

GamePlayers.init(
  {
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: 'game_players',
    timestamps: true
  }
);

// Relations
Game.belongsToMany(User, { through: GamePlayers, as: "players" });
User.belongsToMany(Game, { through: GamePlayers, as: "games" });

// Relation pour le créateur
Game.belongsTo(User, { foreignKey: "creator", as: "creatorPlayer" });
// Relation pour le gagnant
Game.belongsTo(User, { foreignKey: "winner", as: "winPlayer" });

export default Game;
export { GamePlayers };
