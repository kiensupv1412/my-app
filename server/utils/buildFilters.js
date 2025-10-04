/*
 * path: server/utils/buildFilters.js
 */

import { Op } from "sequelize";

export function buildFilters(query) {
  const where = {};

  // filter theo title (search)
  if (query.title && String(query.title).trim().length > 0) {
    const keyword = `%${String(query.title).trim()}%`;
    // Nếu dùng Postgres thì nên là iLike, MySQL thì Like
    where.title =
      process.env.DB_CLIENT === "pg"
        ? { [Op.iLike]: keyword }
        : { [Op.like]: keyword };
  }

  // filter theo category_id
  if (query.category_id) {
    const catId = Number(query.category_id);
    if (Number.isFinite(catId)) {
      where.category_id = catId;
    }
  }

  // filter theo status
  if (query.status && String(query.status).length > 0) {
    where.status = String(query.status);
  }

  // Có thể mở rộng thêm (date range, author_id, vv.)
  if (query.fromDate && query.toDate) {
    where.updated_at = {
      [Op.between]: [new Date(query.fromDate), new Date(query.toDate)],
    };
  }

  return { where };
}
