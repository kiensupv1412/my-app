/*
 * path: server/controllers/article.controller.js
 */

const fs = require('fs');
const Article = require('../models/article.model');
const { getMediaById } = require('../models/media.model');
const Category = require('../models/category.model');
const Media = require('../models/media.model');

// Lấy tất cả articles
async function getArticles(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page ?? '1', 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit ?? '10', 10) || 10, 1);
    const offset = (page - 1) * limit;

    const { rows, count } = await Article.findAndCountAll({
      order: [['id', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Media,
          as: 'thumb',
        },
      ],
    });

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        hasNext: offset + rows.length < count,
      },
    });
  } catch (e) {
    next(e);
  }
}

// Lấy tất cả categories 
async function getCategories(req, res, next) {
  try {
    const rows = await Category.findAll({
      order: [['id', 'ASC']]
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

// Lấy 1 article theo id
async function getArticle(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });

    const row = await Article.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Media,
          as: 'thumb',
        },
      ],
    });
    if (!row) return res.status(404).json({ error: 'Not found' });

    res.json(row);
  } catch (e) {
    next(e);
  }
}

// Tạo mới article
async function postArticle(req, res, next) {
  try {
    const data = req.body;
    const article = await Article.create(data);
    res.json(article);
  } catch (e) {
    next(e);
  }
}

// Update 1 article (partial update theo body gửi lên)
async function updateArticleOne(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body; // chỉ cần field nào có thì update field đó

    const [affectedRows] = await Article.update(data, { where: { id } });
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await Article.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    const plain = updated.get({ plain: true });

    res.json(plain);
  } catch (e) {
    next(e);
  }
}

// Bulk update articles
async function updateArticleBulk(req, res, next) {
  try {
    const items = req.body || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Với Sequelize, bạn có thể dùng bulkCreate + updateOnDuplicate
    await Article.bulkCreate(items, {
      updateOnDuplicate: ['title', 'slug', 'description', 'body', 'category_id', 'status', 'content'],
    });

    // tuỳ chọn: lưu cache
    fs.writeFileSync('data.json', JSON.stringify(items, null, 2));

    res.json({ mess: 'ok' });
  } catch (e) {
    next(e);
  }
}

// Cập nhật thumbnail
async function setThumb(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { media_id } = req.body;

    if (!Number.isFinite(id) || !Number.isFinite(Number(media_id))) {
      return res.status(400).json({ error: 'Bad id/media_id' });
    }

    const media = await getMediaById(Number(media_id));
    if (!media) return res.status(404).json({ error: 'Media not found' });

    await Article.update({ thumb: media.url }, { where: { id } });
    res.json({ mess: 'ok', id, thumb: media.url });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getArticles,
  getCategories,
  getArticle,
  postArticle,
  updateArticleOne,
  updateArticleBulk,
  setThumb,
};