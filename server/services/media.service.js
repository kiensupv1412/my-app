const path = require("path");
const sequelize = require("../models/db");
const Media = require("../models/media.model");
const { toUuid } = require("../utils/uuid");
const { publicUrlFromAbs } = require("../helpers/upload");

async function saveMedia(input) {
  const t = await sequelize.transaction();
  try {
    const payloads = input.files.map((f) => ({
      folder_id: input.folder_id,
      is_background: input.is_background,
      media_type: f.mimetype?.startsWith("video/") ? "video" : "image",
      uuid: toUuid(),
      name: f.originalname,
      file_name: f.filename,
      file_url: publicUrlFromAbs(f.path),
      file_size: f.size,
      extension: path.extname(f.originalname || "").replace(".", ""),
      mime: f.mimetype,
      height: null,
      width: null,
    }));

    const rows =
      payloads.length === 1
        ? [await Media.create(payloads[0], { transaction: t })]
        : await Media.bulkCreate(payloads, { transaction: t, returning: true });

    await t.commit();
    return rows;
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

module.exports = {
  saveMedia,
};
