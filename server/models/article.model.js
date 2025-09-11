const { query } = require('./db')

async function listArticles() {
    const sql = `
    SELECT a.*, c.name AS category_name
    FROM article a
    LEFT JOIN category c ON a.category_id = c.id
    WHERE a.slug NOT LIKE '%tu-vi-tuoi%'
      AND a.slug NOT LIKE '%tu-vi-tron-doi%'
  `
    return query(sql)
}

async function listCategories() {
    return query(`SELECT id, name, slug FROM category ORDER BY name ASC`)
}

async function getArticleById(id) {
    const rows = await query(`SELECT * FROM article WHERE id = ?`, [id])
    return rows[0] || null
}

async function updateArticle({ id, body, textUpdate }) {
    const sql = `UPDATE article SET body=?, textUpdate=? WHERE id=?`
    return query(sql, [body, textUpdate, id])
}

async function bulkUpdateArticles(items) {
    // ⚠️ tránh multipleStatements, chạy tuần tự cho an toàn
    for (const it of items) {
        await updateArticle({ id: it.id, body: it.body, textUpdate: it.textUpdate })
    }
    return true
}

async function updateThumb(id, thumbUrl) {
    return query(`UPDATE article SET thumb=? WHERE id=?`, [thumbUrl, id])
}

module.exports = {
    listArticles,
    listCategories,
    getArticleById,
    updateArticle,
    bulkUpdateArticles,
    updateThumb
}