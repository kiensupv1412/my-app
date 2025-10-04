/*
 * path: server/utils/pagination.js
 */

// parse page/limit từ query
function parsePagination(q, defaultLimit = 15, maxLimit = 100) {
  const page = Math.max(parseInt(q.page ?? "1", 10) || 1, 1);
  const limit = Math.min(
    parseInt(q.limit ?? defaultLimit, 10) || defaultLimit,
    maxLimit
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
// build meta.pagination kiểu Ghost
function buildMeta({ page, limit, total }) {
  const pages = Math.max(Math.ceil(total / limit), 1);
  const prev = page > 1 ? page - 1 : null;
  const next = page < pages ? page + 1 : null;
  return { limit, pages, total, prev, next };
}

module.exports = { parsePagination, buildMeta };
