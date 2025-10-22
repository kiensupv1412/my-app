// server/models/user_tokens.model.js
const { DataTypes } = require("sequelize");
const Users = require("./users.model");
const authDB = require("./auth.db");

const UserTokens = authDB.define(
  "UserTokens",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "google",
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    token_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "user_tokens",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

// Liên kết quan hệ
UserTokens.belongsTo(Users, { foreignKey: "user_id", as: "user" });
Users.hasMany(UserTokens, { foreignKey: "user_id", as: "tokens" });

module.exports = UserTokens;
