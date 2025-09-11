const mysql = require('mysql')

const pool = mysql.createPool({
    host: process.env.DB_HOST || '103.179.188.159',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'tvbt_news',
    connectionLimit: 10
})

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

module.exports = { pool, query }