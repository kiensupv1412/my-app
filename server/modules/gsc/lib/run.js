// lib/run.js
const { fetchSearchAnalytics, fetchIndexStatus, fetchSitemapUrls, getAccessToken } = require("../shared/index.js");
// TODO: thay các chỗ ghi file bằng ghi DB ở bước sau

/**
 * Chạy đồng bộ GSC cho 1 site trong khoảng ngày (hoặc danh sách URL cụ thể)
 * @param {object} p
 * @param {string} p.siteUrl
 * @param {string} [p.from]      // 'YYYY-MM-DD'
 * @param {string} [p.to]        // 'YYYY-MM-DD'
 * @param {string[]} [p.urls]    // optional, nếu muốn chỉ check một số URL
 */
async function runGscSync({ siteUrl, from, to, urls } = {}) {
  const accessToken = await getAccessToken(); // KHÔNG console.exit, chỉ throw khi lỗi
  const result = {};

  if (from && to) {
    result.analytics = await fetchSearchAnalytics({ accessToken, siteUrl, from, to });
  }

  if (urls?.length) {
    result.indexStatuses = [];
    for (const url of urls) {
      const status = await fetchIndexStatus({ accessToken, url, siteUrl });
      result.indexStatuses.push({ url, status });
    }
  }

  // ví dụ lấy sitemap URL (nếu cần)
  result.sitemapUrls = await fetchSitemapUrls({ accessToken, siteUrl });

  return result; // trả dữ liệu cho caller (API/worker) tự xử lý (ghi DB, v.v.)
}

module.exports = { runGscSync };
