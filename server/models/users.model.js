const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const authDB = require("./auth.db");

const Users = authDB.define(
  "Users",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    analytics_period: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "7d",
    },
    hidden_sites: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Users;
