/*
 * path: server/controllers/article.controller.js
 */

const Article = require("../models/article.model");
const Category = require("../models/category.model");
const Media = require("../models/media.model");
const { parsePagination, buildMeta } = require("../utils/pagination");
const { ok, created, badRequest, notFound } = require("../utils/http");
const { parseId } = require("../utils/ids");
const buildFilters = require("../utils/buildFilters");

// Lấy tất cả articles
async function getArticles(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query, 15);

    const { where } = buildFilters(req.query);

    const total = await Article.count({ where });

    const rows = await Article.findAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
      subQuery: false,
      include: [
        { model: Category, as: "category" },
        { model: Media, as: "thumb" },
      ],
    });

    res.json({
      posts: rows,
      meta: buildMeta({ page, limit, total }),
    });
  } catch (e) {
    next(e);
  }
}

// Lấy 1 article theo id
async function getArticle(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return badRequest(res, "Bad id");

    const row = await Article.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
        },
        {
          model: Media,
          as: "thumb",
        },
      ],
    });
    if (!row) return notFound(res);

    return ok(res, row);
  } catch (e) {
    next(e);
  }
}

// Lấy tất cả categories
async function getCategories(req, res, next) {
  try {
    const rows = await Category.findAll({ order: [["id", "ASC"]] });
    return ok(res, rows);
  } catch (e) {
    next(e);
  }
}

// Tạo mới article
async function postArticle(req, res, next) {
  try {
    const data = req.body;
    const article = await Article.create(data);
    return created(res, article, `/articles/${article.id}`);
  } catch (e) {
    next(e);
  }
}

// Update 1 article (partial update theo body gửi lên)
async function updateArticleOne(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return badRequest(res, "Bad id");

    const data = req.body;

    const [affected] = await Article.update(data, { where: { id } });
    if (!affected) return notFound(res);

    const updated = await Article.findByPk(id, {
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
      ],
    });

    return ok(res, updated.get({ plain: true }));
  } catch (e) {
    next(e);
  }
}

// Xóa 1 article theo id
async function deleteArticleOne(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return badRequest(res, "Bad id");

    const affected = await Article.destroy({ where: { id } });
    if (!affected) return notFound(res);

    return ok(res, { message: "Deleted" });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getArticles,
  getCategories,
  getArticle,
  deleteArticleOne,
  postArticle,
  updateArticleOne,
};
