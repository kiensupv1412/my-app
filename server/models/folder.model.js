// server/models/folder.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const Media = require("./media.model")

const Folder = sequelize.define('media_folders', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
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
  timestamps: true,
  underscored: true,
});

Folder.hasMany(Media, { foreignKey: 'folder_id', sourceKey: 'id' });
Media.belongsTo(Folder, { foreignKey: 'folder_id', targetKey: 'id' });

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