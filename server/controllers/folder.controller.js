/*
 * path: server/controllers/folder.controller.js
 */
const path = require("path");
const { ensureDir } = require("fs-extra"); // dùng fs-extra để có promise

const { Folder } = require("../models/folder.model");
const Media = require("../models/media.model");
const Sequelize = require("../models/db");
const { ok, created, badRequest, notFound } = require("../utils/http");
const { UPLOADS_DIR } = require("../helpers/paths");

function slugify(s) {
  return (
    String(s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "folder"
  );
}

// GET /folders
async function list(req, res, next) {
  try {
    const rows = await Folder.findAll({
      attributes: [
        "id",
        "name",
        "slug",
        "created_at",
        "updated_at",
        [Sequelize.fn("COUNT", Sequelize.col("Media.id")), "media_count"],
      ],
      include: [
        {
          model: Media,
          attributes: [],
        },
      ],
      group: ["media_folders.id"],
      order: [["id", "DESC"]],
    });

    return ok(res, rows);
  } catch (e) {
    next(e);
  }
}

// POST /folders
async function create(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return badRequest(res, "Name is required");

    // tạo slug cơ bản
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // đảm bảo slug unique
    while (await Folder.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // tạo record
    const folder = await Folder.create({ name, slug });

    // tạo thư mục vật lý
    await ensureDir(path.join(UPLOADS_DIR, slug));

    return created(res, folder);
  } catch (e) {
    next(e);
  }
}

// DELETE /folders/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

    const folder = await Folder.findByPk(id);
    if (!folder) return res.status(404).json({ error: "Not found" });

    // TODO: kiểm tra bảng media_storage nếu còn file thì chặn
    await folder.destroy();
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, remove };
