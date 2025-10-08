const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST, // hoặc IP/VPS/remote host
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: "mysql", // bạn dùng MariaDB/MySQL thì để mysql
    logging: false, // true nếu muốn log SQL
    define: {
      freezeTableName: true, // không tự động đổi tên bảng thành số nhiều
    },
  }
);

module.exports = sequelize;
