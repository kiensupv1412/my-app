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
const { Op } = require("sequelize");
const Tag = require("../models/tags.model");

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

async function checkSlugAvailability(req, res, next) {
  const { slug } = req.params;
  if (!slug)
    return res.status(400).json({ success: false, message: "Missing slug" });
  const excludeId = req.body.exclude_id;
  const where = excludeId ? { slug, id: { [Op.ne]: excludeId } } : { slug };
  const available = await Article.findOne({ attributes: ["id"], where });

  return res.json({
    available: !available,
    slug: slug,
    conflict_id: available?.id ?? null,
  });
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

// Tìm kiếm tags
async function searchTags(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const qSlug = slugifyVi(q);

    const whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `${q}%` } },
        { slug: { [Op.like]: `${qSlug}%` } },
      ],
    };

    const rows = await Tag.findAll({
      attributes: ["id", "name", "slug"],
      where: whereClause,
      order: [["name", "ASC"]],
    });

    return res.json(rows);
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Search failed" });
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

const slugifyVi = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

module.exports = {
  getArticles,
  getCategories,
  getArticle,
  checkSlugAvailability,
  searchTags,
  deleteArticleOne,
  postArticle,
  updateArticleOne,
};
