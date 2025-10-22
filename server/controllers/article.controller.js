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
const {
  ConflictError,
  ValidationError,
  BadRequestError,
  NotFoundError,
} = require("../error");
const { normalizeSlug } = require("../utils/url");
const sequelize = require("../models/db");

// Lấy tất cả articles
async function getArticles(req, res, next) {
  try {
    const tagIds = req.query.tag_id || "";

    const { page, limit, offset } = parsePagination(req.query, 15);

    const { where } = buildFilters(req.query);

    const total = await Article.count({ where });

    const rows = await Article.findAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
      include: [
        { model: Category, as: "category" },
        { model: Media, as: "thumb" },
        {
          model: Tag,
          as: "tags",
          ...(tagIds ? { where: { id: tagIds } } : {}),
        },
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
    console.log("🚀 ~ getArticle ~ id:", id);
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
        {
          model: Tag,
          as: "tags",
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

async function getTags(req, res, next) {
  try {
    const rows = await Tag.findAll({ order: [["id", "ASC"]] });
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

    const qSlug = normalizeSlug(q);

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
    next(e);
  }
}

// ============ Tạo mới ============
async function postArticle(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const data = req.body || {};
    if (!data.slug)
      throw new ValidationError({
        message: "Thiếu slug.",
        code: "MISSING_SLUG",
      });

    data.slug = await assertSlugAvailable(data.slug); // ném lỗi 409 nếu trùng

    const inputTags = Array.isArray(data.tags) ? data.tags : undefined;
    delete data.tags;

    const article = await Article.create(data, { transaction: t });

    if (inputTags !== undefined) {
      const tagIds = await ensureTagIdsFromClient(inputTags, t); // [] => clear all
      await article.setTags(tagIds, { transaction: t });
    }

    await t.commit();

    const fresh = await Article.findByPk(article.id, {
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        {
          model: Tag,
          attributes: ["id", "name", "slug"],
          through: { attributes: [] },
        },
      ],
    });

    return res
      .status(201)
      .location(`/articles/${article.id}`)
      .json({ success: true, data: fresh });
  } catch (e) {
    next(e);
  }
}

// ============ Cập nhật (partial) ============
async function updateArticleOne(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id) || 0;
    if (!id) throw new BadRequestError({ message: "Bad id", hideStack: true });

    const data = req.body || {};
    console.log("🚀 ~ updateArticleOne ~ data:", data);

    // --- chuẩn hoá & kiểm tra slug nếu có gửi ---
    if (data.slug != null) {
      data.slug = await assertSlugAvailable(data.slug, id); // ném ConflictError nếu trùng
    }

    // --- tách tags ra khỏi payload trước khi update ---
    const inputTags = Array.isArray(data.tags) ? data.tags : undefined;
    delete data.tags;

    // --- update fields ---
    const [affected] = await Article.update(data, {
      where: { id },
      transaction: t,
    });
    if (!affected)
      throw new NotFoundError({
        message: "Article không tồn tại.",
        hideStack: true,
      });

    // --- lấy instance để thao tác belongsToMany ---
    const article = await Article.findByPk(id, { transaction: t });
    if (!article)
      throw new NotFoundError({
        message: "Article không tồn tại.",
        hideStack: true,
      });

    // --- ghi đè tags nếu client có gửi ---
    if (inputTags !== undefined) {
      const tagIds = await ensureTagIdsFromClient(inputTags, t); // [] => clear all
      await article.setTags(tagIds, { transaction: t }); // <-- GỌI TRÊN INSTANCE
    }

    await t.commit();

    // --- load lại để trả về ---
    const updated = await Article.findByPk(id, {
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name", "slug"],
          through: { attributes: [] },
        },
      ],
    });

    return res.json({ success: true, data: updated.get({ plain: true }) });
  } catch (e) {
    await t.rollback();
    next(e);
  }
}

/**
 * - Tồn tại bài khác dùng slug → ném ConflictError (409)
 * - Hợp lệ → trả về slug đã chuẩn hoá để dùng tiếp
 */
async function assertSlugAvailable(slug, excludeId = null) {
  if (!slug) {
    throw new ValidationError({
      message: "Slug không hợp lệ.",
      code: "INVALID_SLUG",
    });
  }

  const where = excludeId
    ? { slug: slug, id: { [Op.ne]: excludeId } }
    : { slug: slug };
  const exist = await Article.findOne({ where, attributes: ["id"] });

  if (exist) {
    throw new ConflictError({
      message: "Slug đã tồn tại ở bài khác.",
      code: "SLUG_TAKEN",
      context: { slug: slug, existId: exist.id, excludeId },
      level: "normal",
      hideStack: true,
    });
  }

  return slug;
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

/**
 * ensureTagIdsFromClient
 * Nhận mảng tag client gửi (có thể pha trộn tag cũ & tag mới isNew),
 * trả về danh sách tagId (tạo mới nếu cần).
 */
async function ensureTagIdsFromClient(inputTags = [], t) {
  if (!Array.isArray(inputTags)) {
    throw new ValidationError({
      message: "Trường tags phải là mảng.",
      hideStack: true,
    });
  }
  if (inputTags.length === 0) return [];

  const ids = [];
  for (const item of inputTags) {
    if (!item || typeof item !== "object") {
      throw new ValidationError({
        message: "Tag không hợp lệ.",
        code: "INVALID_TAG",
        hideStack: true,
      });
    }

    // CASE 1: tag mới từ client (id tạm, isNew=true)
    if (item.isNew) {
      const rawSlug = item.slug;
      const cleanSlug = normalizeSlug(rawSlug);
      if (!cleanSlug) {
        throw new ValidationError({
          message: "Tag mới thiếu name/slug hợp lệ.",
          code: "INVALID_NEW_TAG",
          hideStack: true,
        });
      }
      const name = (item.name && String(item.name).trim()) || cleanSlug;

      const [tag] = await Tag.findOrCreate({
        where: { slug: cleanSlug },
        defaults: { name, slug: cleanSlug },
        transaction: t,
      });
      ids.push(tag.id);
      continue;
    }

    // CASE 2: tag đã tồn tại
    if (item.id) {
      // tin tưởng id do client gửi (tùy bạn có muốn verify tồn tại)
      ids.push(Number(item.id));
      continue;
    }

    if (item.slug) {
      const cleanSlug = normalizeSlug(item.slug);
      const found = await Tag.findOne({
        where: { slug: cleanSlug },
        attributes: ["id"],
        transaction: t,
      });
      if (!found) {
        throw new ValidationError({
          message: `Tag với slug '${cleanSlug}' không tồn tại.`,
          code: "TAG_NOT_FOUND",
          hideStack: true,
        });
      }
      ids.push(found.id);
      continue;
    }

    // không id, không slug → lỗi
    throw new ValidationError({
      message: "Tag thiếu id/slug.",
      code: "TAG_MISSING_KEYS",
      hideStack: true,
    });
  }

  // loại trùng
  return Array.from(new Set(ids));
}

module.exports = {
  getArticles,
  getCategories,
  getTags,
  getArticle,
  searchTags,
  deleteArticleOne,
  postArticle,
  updateArticleOne,
};
