import { DataTypes } from "@sequelize/core";
import { sequelize } from "../bdd.js";

const User = sequelize.define("user", {
	id: {
		type: DataTypes.STRING,
		autoIncrement: false,
		primaryKey: true,
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	firstname: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	lastname: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	bestScrore: {
		type: DataTypes.INTEGER,
		allowNull: true,
	},
	verified: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
});

export default User;
