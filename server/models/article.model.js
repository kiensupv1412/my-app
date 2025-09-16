// const { query } = require('./db')

// async function listArticles() {
//     const sql = `
//     SELECT a.*, c.name AS category_name
//     FROM article a
//     LEFT JOIN category c ON a.category_id = c.id
//     WHERE a.slug NOT LIKE '%tu-vi-tuoi%'
//       AND a.slug NOT LIKE '%tu-vi-tron-doi%'
//   `
//     return query(sql)
// }

// async function listCategories() {
//     return query(`SELECT id, name, slug FROM category ORDER BY name ASC`)
// }

// async function getArticleById(id) {
//     const rows = await query(`SELECT * FROM article WHERE id = ?`, [id])
//     return rows[0] || null
// }

// async function createArticle({ title,slug, description, body, category_id, status,content }) {
//    const sql =`INSERT INTO article (title,slug, description, body, category_id, status,content) 
//    VALUES (?,?, ?, ?, ?, ?,?)`;
//     return await query(sql,[title,slug, description, body, category_id, status,content])
// }


// async function updateArticle({ id, title,description ,body,category_id,status }) {
//     const sql = `UPDATE article SET title=?,description=?,category_id=?, body=?,status=? WHERE id=?`
//     return query(sql, [title,description,category_id, body,status, id])
// }

// async function bulkUpdateArticles(items) {
//     // ⚠️ tránh multipleStatements, chạy tuần tự cho an toàn
//     for (const it of items) {
//         await updateArticle({ id: it.id, body: it.body, textUpdate: it.textUpdate })
//     }
//     return true
// }

// async function updateThumb(id, thumbUrl) {
//     return query(`UPDATE article SET thumb=? WHERE id=?`, [thumbUrl, id])
// }

// module.exports = {
//     listArticles,
//     listCategories,
//     createArticle,
//     getArticleById,
//     updateArticle,
//     bulkUpdateArticles,
//     updateThumb
// }


const { DataTypes } = require('sequelize');
const sequelize = require('./db');    

const Article = sequelize.define('article', {
  title: DataTypes.STRING,
  slug: DataTypes.STRING,
  description: DataTypes.TEXT,
  body: DataTypes.TEXT('medium'),
  category_id: DataTypes.INTEGER,
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

module.exports = Article;