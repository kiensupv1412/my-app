const fs = require('fs')
const {
    listArticles,
    listCategories,
    getArticleById,
    updateArticle,
    bulkUpdateArticles,
    updateThumb
} = require('../models/article.model')
const { getMediaById } = require('../models/media.model')

async function getArticles(req, res, next) {
    try {
        const rows = await listArticles()
        res.json(rows)
    } catch (e) { next(e) }
}

async function getCategories(req, res, next) {
    try {
        const rows = await listCategories()
        res.json(rows)
    } catch (e) { next(e) }
}

async function getArticle(req, res, next) {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' })
        const row = await getArticleById(id)
        if (!row) return res.status(404).json({ error: 'Not found' })
        res.json(row)
    } catch (e) { next(e) }
}

async function updateArticleOne(req, res, next) {
    try {
        const { id, body, textUpdate } = req.body
        await updateArticle({ id, body, textUpdate })
        res.json({ mess: 'ok', id })
    } catch (e) { next(e) }
}

async function updateArticleBulk(req, res, next) {
    try {
        const items = req.body || []
        await bulkUpdateArticles(items)
            // tuỳ: lưu file cache
        fs.writeFileSync('data.json', JSON.stringify(items, null, 2))
        res.json({ mess: 'ok' })
    } catch (e) { next(e) }
}

async function setThumb(req, res, next) {
    try {
        const id = Number(req.params.id)
        const { media_id } = req.body
        if (!Number.isFinite(id) || !Number.isFinite(Number(media_id))) {
            return res.status(400).json({ error: 'Bad id/media_id' })
        }
        const media = await getMediaById(Number(media_id))
        if (!media) return res.status(404).json({ error: 'Media not found' })
        await updateThumb(id, media.url)
        res.json({ mess: 'ok', id, thumb: media.url })
    } catch (e) { next(e) }
}

module.exports = {
    getArticles,
    getCategories,
    getArticle,
    updateArticleOne,
    updateArticleBulk,
    setThumb
}