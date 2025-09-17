/*
 * path: server/models/article.model.js
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const Category = require('./category.model');

const Article = sequelize.define('article', {
  title: DataTypes.STRING,
  slug: DataTypes.STRING,
  description: DataTypes.TEXT,
  body: DataTypes.TEXT('medium'),
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  status: DataTypes.STRING,
  content: DataTypes.TEXT('long'),
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Article.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Article, { foreignKey: 'category_id' });


module.exports = Article;