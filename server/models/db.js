// const mysql = require('mysql')

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || '103.179.188.159',
//     port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME || 'tvbt_news',
//     connectionLimit: 10
// })

// function query(sql, params = []) {
//     return new Promise((resolve, reject) => {
//         pool.query(sql, params, (err, rows) => {
//             if (err) return reject(err)
//             resolve(rows)
//     })
// })
// }

// module.exports = { pool, query }


const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
    host: process.env.DB_HOST,        // hoặc IP/VPS/remote host
    port:process.env.DB_PORT,
    dialect: 'mysql',         // bạn dùng MariaDB/MySQL thì để mysql
    logging: false,           // true nếu muốn log SQL
    define: {
      freezeTableName: true,  // không tự động đổi tên bảng thành số nhiều
    },
  });
  
  module.exports = sequelize;