/*
 * path: server/models/media.model.js
 */
const { DataTypes } = require('sequelize');
const sequelize = require("./db");  

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  site: { type: DataTypes.INTEGER, defaultValue: 0 },
  user_id: { type: DataTypes.INTEGER, defaultValue: 0 },
  folder_id: { type: DataTypes.INTEGER, allowNull: true },

  media_type: { type: DataTypes.STRING(20), defaultValue: 'image' },
  uuid: { type: DataTypes.STRING(64), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  alt: { type: DataTypes.STRING(255), allowNull: true },
  caption: { type: DataTypes.TEXT, allowNull: true },
  link: { type: DataTypes.STRING(255), allowNull: true },
  thumbnail: { type: DataTypes.STRING(255), allowNull: true },

  file_name: { type: DataTypes.STRING(255), allowNull: false },
  file_url: { type: DataTypes.STRING(500), allowNull: false },
  file_size: { type: DataTypes.BIGINT, allowNull: true },
  extension: { type: DataTypes.STRING(20), allowNull: true },
  mime: { type: DataTypes.STRING(100), allowNull: false },

  height: { type: DataTypes.INTEGER, allowNull: true },
  width: { type: DataTypes.INTEGER, allowNull: true },
  duration: { type: DataTypes.INTEGER, allowNull: true },
  orientation: { type: DataTypes.STRING(50), allowNull: true },
  version: { type: DataTypes.STRING(50), allowNull: true },

  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'media_storage',
  timestamps: false,       // vì bạn đang dùng created_at, updated_at tự quản lý
  underscored: true,       // cột snake_case
});

module.exports = Media;