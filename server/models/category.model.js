/*
 * path: server/models/category.model.js
 */
const { DataTypes } = require('sequelize');
const sequelize = require('./db');  

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parent_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'category',
});

module.exports = Category;