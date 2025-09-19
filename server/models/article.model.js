/*
 * path: server/models/article.model.js
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const Category = require('./category.model');
const Media = require('./media.model');

const Article = sequelize.define('article', {
  title: DataTypes.STRING,
  slug: DataTypes.STRING,
  description_html: DataTypes.TEXT,
  description: DataTypes.TEXT,
  content_html: DataTypes.TEXT('medium'),
  content: DataTypes.TEXT('medium'),
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  thumb_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
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

Article.belongsTo(Media, { foreignKey: 'thumb_id', as: 'thumb' });
Media.hasMany(Article, { foreignKey: 'thumb_id' });

module.exports = Article;