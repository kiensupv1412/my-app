// models/Tag.ts
const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Tag = sequelize.define(
  "Tag",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  },
  { tableName: "tags", timestamps: false }
);

module.exports = Tag;
