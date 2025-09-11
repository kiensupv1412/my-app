import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { getAccessToken } from "./shared/auth";
import {
  checkCustomUrls,
  checkSiteUrl,
  convertToFilePath,
  convertToSiteUrl,
  getEmojiForStatus,
  getPageIndexingStatus,
  getPublishMetadata,
  requestIndexing,
} from "./shared/gsc";
import { getSitemapPages } from "./shared/sitemap";
import { Status } from "./shared/types";
import { batch } from "./shared/utils";

const CACHE_TIMEOUT = 1000 * 60 * 60 * 24 * 14; // 14 days
export const QUOTA = {
  rpm: {
    retries: 3,
    waitingTime: 60000, // 1 minute
  },
};

/**
 * Indexes the specified domain or site URL.
 * @param input - The domain or site URL to index.
 * @param options - (Optional) Additional options for indexing.
 */
export const index = async (input = process.argv[2], options) => {
  if (!input) {
    console.error("❌ Please provide a domain or site URL as the first argument.");
    console.error("");
    process.exit(1);
  }

  if (!options.client_email) {
    options.client_email = process.env.GIS_CLIENT_EMAIL;
  }
  if (!options.private_key) {
    options.private_key = process.env.GIS_PRIVATE_KEY;
  }
  if (!options.path) {
    options.path = process.env.GIS_PATH;
  }
  if (!options.urls) {
    options.urls = process.env.GIS_URLS ? process.env.GIS_URLS.split(",") : undefined;
  }
  if (!options.quota) {
    options.quota = {
      rpmRetry: process.env.GIS_QUOTA_RPM_RETRY === "true",
    };
  }

  const accessToken = await getAccessToken(options.client_email, options.private_key, options.path);
  let siteUrl = convertToSiteUrl(input);
  console.log(`🔎 Processing site: ${siteUrl}`);
  const cachePath = path.join(".cache", `${convertToFilePath(siteUrl)}.json`);

  if (!accessToken) {
    console.error("❌ Failed to get access token, check your service account credentials.");
    console.error("");
    process.exit(1);
  }

  siteUrl = await checkSiteUrl(accessToken, siteUrl);

  let pages = options.urls || [];
  if (pages.length === 0) {
    console.log(`🔎 Fetching sitemaps and pages...`);
    const [sitemaps, pagesFromSitemaps] = await getSitemapPages(accessToken, siteUrl);

    if (sitemaps.length === 0) {
      console.error("❌ No sitemaps found, add them to Google Search Console and try again.");
      console.error("");
      process.exit(1);
    }

    pages = pagesFromSitemaps;

    console.log(`👉 Found ${pages.length} URLs in ${sitemaps.length} sitemap`);
  } else {
    pages = checkCustomUrls(siteUrl, pages);
    console.log(`👉 Found ${pages.length} URLs in the provided list`);
  }

  const statusPerUrl = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
  const pagesPerStatus = {
    [Status.SubmittedAndIndexed]: [],
    [Status.DuplicateWithoutUserSelectedCanonical]: [],
    [Status.CrawledCurrentlyNotIndexed]: [],
    [Status.DiscoveredCurrentlyNotIndexed]: [],
    [Status.PageWithRedirect]: [],
    [Status.URLIsUnknownToGoogle]: [],
    [Status.RateLimited]: [],
    [Status.Forbidden]: [],
    [Status.Error]: [],
  };

  const indexableStatuses = [
    Status.DiscoveredCurrentlyNotIndexed,
    Status.CrawledCurrentlyNotIndexed,
    Status.URLIsUnknownToGoogle,
    Status.Forbidden,
    Status.Error,
    Status.RateLimited,
  ];

  const shouldRecheck = (status, lastCheckedAt) => {
    const shouldIndexIt = indexableStatuses.includes(status);
    const isOld = new Date(lastCheckedAt) < new Date(Date.now() - CACHE_TIMEOUT);
    return shouldIndexIt && isOld;
  };

  await batch(
    async (url) => {
      let result = statusPerUrl[url];
      if (!result || shouldRecheck(result.status, result.lastCheckedAt)) {
        const status = await getPageIndexingStatus(accessToken, siteUrl, url);
        result = { status, lastCheckedAt: new Date().toISOString() };
        statusPerUrl[url] = result;
      }

      pagesPerStatus[result.status] = pagesPerStatus[result.status] ? [...pagesPerStatus[result.status], url] : [url];
    },
    pages,
    50,
    (batchIndex, batchCount) => {
      console.log(`📦 Batch ${batchIndex + 1} of ${batchCount} complete`);
    },
  );

  console.log(``);
  console.log(`👍 Done, here's the status of all ${pages.length} pages:`);
  mkdirSync(".cache", { recursive: true });
  writeFileSync(cachePath, JSON.stringify(statusPerUrl, null, 2));

  for (const status of Object.keys(pagesPerStatus)) {
    const pages = pagesPerStatus[status];
    if (pages.length === 0) continue;
    console.log(`• ${getEmojiForStatus(status)} ${status}: ${pages.length} pages`);
  }
  console.log("");

  const indexablePages = Object.entries(pagesPerStatus).flatMap(([status, pages]) =>
    indexableStatuses.includes(status) ? pages : [],
  );

  if (indexablePages.length === 0) {
    console.log(`✨ There are no pages that can be indexed. Everything is already indexed!`);
  } else {
    console.log(`✨ Found ${indexablePages.length} pages that can be indexed.`);
    indexablePages.forEach((url) => console.log(`• ${url}`));
  }
  console.log(``);

  for (const url of indexablePages) {
    console.log(`📄 Processing url: ${url}`);
    const status = await getPublishMetadata(accessToken, url, {
      retriesOnRateLimit: options.quota.rpmRetry ? QUOTA.rpm.retries : 0,
    });
    if (status === 404) {
      await requestIndexing(accessToken, url);
      console.log("🚀 Indexing requested successfully. It may take a few days for Google to process it.");
    } else if (status < 400) {
      console.log(`🕛 Indexing already requested previously. It may take a few days for Google to process it.`);
    }
    console.log(``);
  }

  console.log(`👍 All done!`);
  console.log(`💖 Brought to you by https://seogets.com - SEO Analytics.`);
  console.log(``);
};

export * from "./shared";
