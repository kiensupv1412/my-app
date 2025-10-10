const path = require("path");
const sequelize = require("../models/db");
const Media = require("../models/media.model");
const { toUuid } = require("../utils/uuid");
const { publicUrlFromAbs } = require("../helpers/upload");
const { PUBLIC_DIR, UPLOADS_DIR } = require("../helpers/paths");
const { toNumber } = require("lodash");

async function saveMedia(input) {
  const t = await sequelize.transaction();
  try {
    const filePath = path.join(UPLOADS_DIR, input.file.filename);
    const payload = {
      folder_id: toNumber(input.folder_id),
      is_background: input.is_background,
      media_type: input.file.mimetype?.startsWith("video/") ? "video" : "image",
      uuid: toUuid(),
      name: input.file.originalname,
      file_name: input.file.filename,
      file_url: publicUrlFromAbs(filePath),
      file_size: input.file.size,
      extension: path.extname(input.file.originalname || "").replace(".", ""),
      mime: input.file.mimetype,
      height: null,
      width: null,
    };

    const rows = await Media.create(payload, { transaction: t });

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
