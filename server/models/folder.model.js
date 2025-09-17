// server/models/folder.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Folder = sequelize.define('media_folders', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  site: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'media_folders',
  timestamps: true,     // để Sequelize quản lý createdAt / updatedAt
  underscored: true,    // map created_at, updated_at
});

async function getFolderById(id) {
  return Folder.findByPk(id, { attributes: ['id', 'slug', 'name', 'site'] });
}
async function getFolderBySlug(slug) {
  return Folder.findOne({ where: { slug }, attributes: ['id', 'slug', 'name', 'site'] });
}

module.exports = {
  Folder,
  getFolderById,
  getFolderBySlug,
};