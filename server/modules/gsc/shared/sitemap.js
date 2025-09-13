const Sitemapper = require("sitemapper");
const { fetchRetry } = require("./utils.js");
const { webmasters_v3 } = require("googleapis");

/**
 * Retrieves a list of sitemaps associated with the specified site URL from the Google Webmasters API.
 * @param accessToken The access token for authentication.
 * @param siteUrl The URL of the site for which to retrieve the list of sitemaps.
 * @returns An array containing the paths of the sitemaps associated with the site URL.
 */
async function getSitemapsList(accessToken, siteUrl) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`;

  const response = await fetchRetry(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 403) {
    console.error(`🔐 This service account doesn't have access to this site.`);
    return [];
  }

  if (response.status >= 300) {
    console.error(`❌ Failed to get list of sitemaps.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
    return [];
  }

  const body = await response.json();

  if (!body.sitemap) {
    console.error("❌ No sitemaps found, add them to Google Search Console and try again.");
    return [];
  }

  return body.sitemap.filter((x) => x.path !== undefined && x.path !== null).map((x) => x.path);
}

/**
 * Retrieves a list of pages from all sitemaps associated with the specified site URL.
 * @param accessToken The access token for authentication.
 * @param siteUrl The URL of the site for which to retrieve the sitemap pages.
 * @returns An array containing the list of sitemaps and an array of unique page URLs extracted from those sitemaps.
 */
async function getSitemapPages(accessToken, siteUrl) {
  const sitemaps = await getSitemapsList(accessToken, siteUrl);

  let pages = [];
  for (const url of sitemaps) {
    const Google = new Sitemapper({
      url,
    });

    const { sites } = await Google.fetch();
    pages = [...pages, ...sites];
  }

  return [sitemaps, [...new Set(pages)]];
}

module.exports = { getSitemapsList, getSitemapPages };
