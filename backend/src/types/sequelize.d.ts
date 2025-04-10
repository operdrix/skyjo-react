import { Model } from "sequelize";
import { GameAttributes, UserAttributes } from "./index.js";

// Extend Game model for associations
declare global {
  namespace Express {
    interface Game extends Model<GameAttributes>, GameAttributes {
      players: Array<UserWithGamePlayer>;
      addPlayer: (userId: string) => Promise<any>;
      removePlayer: (userId: string) => Promise<any>;
    }

    interface UserWithGamePlayer extends Model<UserAttributes>, UserAttributes {
      game_players?: {
        status: string;
        save: () => Promise<any>;
      };
    }

    interface User extends Model<UserAttributes>, UserAttributes {
      games: Array<Game>;
    }
  }
} 