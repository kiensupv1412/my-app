#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/auth.ts
async function getAccessToken(client_email, private_key, customPath) {
  if (!client_email && !private_key) {
    const filePath = "service_account.json";
    const filePathFromHome = import_path.default.join(import_os.default.homedir(), ".gis", "service_account.json");
    const isFile = import_fs.default.existsSync(filePath);
    const isFileFromHome = import_fs.default.existsSync(filePathFromHome);
    const isCustomFile = !!customPath && import_fs.default.existsSync(customPath);
    if (!isFile && !isFileFromHome && !isCustomFile) {
      console.error(`\u274C ${filePath} not found, please follow the instructions in README.md`);
      console.error("");
      process.exit(1);
    }
    const key = JSON.parse(
      import_fs.default.readFileSync(!!customPath && isCustomFile ? customPath : isFile ? filePath : filePathFromHome, "utf8")
    );
    client_email = key.client_email;
    private_key = key.private_key;
  } else {
    if (!client_email) {
      console.error("\u274C Missing client_email in service account credentials.");
      console.error("");
      process.exit(1);
    }
    if (!private_key) {
      console.error("\u274C Missing private_key in service account credentials.");
      console.error("");
      process.exit(1);
    }
  }
  const jwtClient = new import_googleapis.google.auth.JWT(
    client_email,
    void 0,
    private_key,
    ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/indexing"],
    void 0
  );
  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}
var import_googleapis, import_fs, import_path, import_os;
var init_auth = __esm({
  "src/auth.ts"() {
    "use strict";
    import_googleapis = require("googleapis");
    import_fs = __toESM(require("fs"));
    import_path = __toESM(require("path"));
    import_os = __toESM(require("os"));
  }
});

// src/utils.ts
async function batch(task, items, batchSize, onBatchComplete) {
  const chunks = createChunks(items, batchSize);
  for (let i = 0; i < chunks.length; i++) {
    await Promise.all(chunks[i].map(task));
    onBatchComplete(i, chunks.length);
  }
}
async function fetchRetry(url, options, retries = 5) {
  try {
    const response = await fetch(url, options);
    if (response.status >= 500) {
      const body = await response.text();
      throw new Error(`Server error code ${response.status}
${body}`);
    }
    return response;
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    return fetchRetry(url, options, retries - 1);
  }
}
var createChunks;
var init_utils = __esm({
  "src/utils.ts"() {
    "use strict";
    createChunks = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
  }
});

// src/types.ts
var Status;
var init_types = __esm({
  "src/types.ts"() {
    "use strict";
    Status = /* @__PURE__ */ ((Status2) => {
      Status2["SubmittedAndIndexed"] = "Submitted and indexed";
      Status2["DuplicateWithoutUserSelectedCanonical"] = "Duplicate without user-selected canonical";
      Status2["CrawledCurrentlyNotIndexed"] = "Crawled - currently not indexed";
      Status2["DiscoveredCurrentlyNotIndexed"] = "Discovered - currently not indexed";
      Status2["PageWithRedirect"] = "Page with redirect";
      Status2["URLIsUnknownToGoogle"] = "URL is unknown to Google";
      Status2["RateLimited"] = "RateLimited";
      Status2["Forbidden"] = "Forbidden";
      Status2["Error"] = "Error";
      return Status2;
    })(Status || {});
  }
});

// src/gsc.ts
function convertToSiteUrl(input) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input.endsWith("/") ? input : `${input}/`;
  }
  return `sc-domain:${input}`;
}
function convertToFilePath(path3) {
  return path3.replace("http://", "http_").replace("https://", "https_").replaceAll("/", "_");
}
function convertToSCDomain(httpUrl) {
  return `sc-domain:${httpUrl.replace("http://", "").replace("https://", "").replace("/", "")}`;
}
function convertToHTTP(domain) {
  return `http://${domain}/`;
}
function convertToHTTPS(domain) {
  return `https://${domain}/`;
}
async function getSites(accessToken) {
  const sitesResponse = await fetchRetry("https://www.googleapis.com/webmasters/v3/sites", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (sitesResponse.status === 403) {
    console.error("\u{1F510} This service account doesn't have access to any sites.");
    return [];
  }
  const sitesBody = await sitesResponse.json();
  if (!sitesBody.siteEntry) {
    console.error("\u274C No sites found, add them to Google Search Console and try again.");
    return [];
  }
  return sitesBody.siteEntry.map((x) => x.siteUrl);
}
async function checkSiteUrl(accessToken, siteUrl) {
  const sites = await getSites(accessToken);
  let formattedUrls = [];
  if (siteUrl.startsWith("https://")) {
    formattedUrls.push(siteUrl);
    formattedUrls.push(convertToHTTP(siteUrl.replace("https://", "")));
    formattedUrls.push(convertToSCDomain(siteUrl));
  } else if (siteUrl.startsWith("http://")) {
    formattedUrls.push(siteUrl);
    formattedUrls.push(convertToHTTPS(siteUrl.replace("http://", "")));
    formattedUrls.push(convertToSCDomain(siteUrl));
  } else if (siteUrl.startsWith("sc-domain:")) {
    formattedUrls.push(siteUrl);
    formattedUrls.push(convertToHTTP(siteUrl.replace("sc-domain:", "")));
    formattedUrls.push(convertToHTTPS(siteUrl.replace("sc-domain:", "")));
  } else {
    console.error("\u274C Unknown site URL format.");
    console.error("");
    process.exit(1);
  }
  for (const formattedUrl of formattedUrls) {
    if (sites.includes(formattedUrl)) {
      return formattedUrl;
    }
  }
  console.error("\u274C This service account doesn't have access to this site.");
  console.error("");
  process.exit(1);
}
function checkCustomUrls(siteUrl, urls) {
  const protocol = siteUrl.startsWith("http://") ? "http://" : "https://";
  const domain = siteUrl.replace("https://", "").replace("http://", "").replace("sc-domain:", "");
  const formattedUrls = urls.map((url) => {
    url = url.trim();
    if (url.startsWith("/")) {
      return `${protocol}${domain}${url}`;
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    } else if (url.startsWith(domain)) {
      return `${protocol}${url}`;
    } else {
      return `${protocol}${domain}/${url}`;
    }
  });
  return formattedUrls;
}
async function getPageIndexingStatus(accessToken, siteUrl, inspectionUrl) {
  try {
    const response = await fetchRetry(`https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        inspectionUrl,
        siteUrl
      })
    });
    if (response.status === 403) {
      console.error(`\u{1F510} This service account doesn't have access to this site.`);
      console.error(await response.text());
      return "Forbidden" /* Forbidden */;
    }
    if (response.status >= 300) {
      if (response.status === 429) {
        return "RateLimited" /* RateLimited */;
      } else {
        console.error(`\u274C Failed to get indexing status.`);
        console.error(`Response was: ${response.status}`);
        console.error(await response.text());
        return "Error" /* Error */;
      }
    }
    const body = await response.json();
    return body.inspectionResult.indexStatusResult.coverageState;
  } catch (error) {
    console.error(`\u274C Failed to get indexing status.`);
    console.error(`Error was: ${error}`);
    throw error;
  }
}
function getEmojiForStatus(status) {
  switch (status) {
    case "Submitted and indexed" /* SubmittedAndIndexed */:
      return "\u2705";
    case "Duplicate without user-selected canonical" /* DuplicateWithoutUserSelectedCanonical */:
      return "\u{1F635}";
    case "Crawled - currently not indexed" /* CrawledCurrentlyNotIndexed */:
    case "Discovered - currently not indexed" /* DiscoveredCurrentlyNotIndexed */:
      return "\u{1F440}";
    case "Page with redirect" /* PageWithRedirect */:
      return "\u{1F500}";
    case "URL is unknown to Google" /* URLIsUnknownToGoogle */:
      return "\u2753";
    case "RateLimited" /* RateLimited */:
      return "\u{1F6A6}";
    default:
      return "\u274C";
  }
}
async function getPublishMetadata(accessToken, url, options) {
  const response = await fetchRetry(
    `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(url)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  if (response.status === 403) {
    console.error(`\u{1F510} This service account doesn't have access to this site.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }
  if (response.status === 429) {
    if (options?.retriesOnRateLimit && options?.retriesOnRateLimit > 0) {
      const RPM_WATING_TIME = (QUOTA.rpm.retries - options.retriesOnRateLimit + 1) * QUOTA.rpm.waitingTime;
      console.log(
        `\u{1F6A6} Rate limit exceeded for read requests. Retries left: ${options.retriesOnRateLimit}. Waiting for ${RPM_WATING_TIME / 1e3}sec.`
      );
      await new Promise((resolve) => setTimeout(resolve, RPM_WATING_TIME));
      await getPublishMetadata(accessToken, url, { retriesOnRateLimit: options.retriesOnRateLimit - 1 });
    } else {
      console.error("\u{1F6A6} Rate limit exceeded, try again later.");
      console.error("");
      console.error("   Quota: https://developers.google.com/search/apis/indexing-api/v3/quota-pricing#quota");
      console.error("   Usage: https://console.cloud.google.com/apis/enabled");
      console.error("");
      process.exit(1);
    }
  }
  if (response.status >= 500) {
    console.error(`\u274C Failed to get publish metadata.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
  }
  return response.status;
}
async function requestIndexing(accessToken, url) {
  const response = await fetchRetry("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      url,
      type: "URL_UPDATED"
    })
  });
  if (response.status === 403) {
    console.error(`\u{1F510} This service account doesn't have access to this site.`);
    console.error(`Response was: ${response.status}`);
  }
  if (response.status >= 300) {
    if (response.status === 429) {
      console.error("\u{1F6A6} Rate limit exceeded, try again later.");
      console.error("");
      console.error("   Quota: https://developers.google.com/search/apis/indexing-api/v3/quota-pricing#quota");
      console.error("   Usage: https://console.cloud.google.com/apis/enabled");
      console.error("");
      process.exit(1);
    } else {
      console.error(`\u274C Failed to request indexing.`);
      console.error(`Response was: ${response.status}`);
      console.error(await response.text());
    }
  }
}
var init_gsc = __esm({
  "src/gsc.ts"() {
    "use strict";
    init_utils();
    init_types();
  }
});

// src/sitemap.ts
async function getSitemapsList(accessToken, siteUrl) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`;
  const response = await fetchRetry(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (response.status === 403) {
    console.error(`\u{1F510} This service account doesn't have access to this site.`);
    return [];
  }
  if (response.status >= 300) {
    console.error(`\u274C Failed to get list of sitemaps.`);
    console.error(`Response was: ${response.status}`);
    console.error(await response.text());
    return [];
  }
  const body = await response.json();
  if (!body.sitemap) {
    console.error("\u274C No sitemaps found, add them to Google Search Console and try again.");
    return [];
  }
  return body.sitemap.filter((x) => x.path !== void 0 && x.path !== null).map((x) => x.path);
}
async function getSitemapPages(accessToken, siteUrl) {
  const sitemaps = await getSitemapsList(accessToken, siteUrl);
  let pages = [];
  for (const url of sitemaps) {
    const Google = new import_sitemapper.default({
      url
    });
    const { sites } = await Google.fetch();
    pages = [...pages, ...sites];
  }
  return [sitemaps, [...new Set(pages)]];
}
var import_sitemapper;
var init_sitemap = __esm({
  "src/sitemap.ts"() {
    "use strict";
    import_sitemapper = __toESM(require("sitemapper"));
    init_utils();
  }
});

// src/index.ts
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_auth();
    init_gsc();
    init_sitemap();
    init_types();
    init_utils();
  }
});

// index.ts
var index_exports = {};
__export(index_exports, {
  QUOTA: () => QUOTA2,
  Status: () => Status,
  batch: () => batch,
  checkCustomUrls: () => checkCustomUrls,
  checkSiteUrl: () => checkSiteUrl,
  convertToFilePath: () => convertToFilePath,
  convertToHTTP: () => convertToHTTP,
  convertToHTTPS: () => convertToHTTPS,
  convertToSCDomain: () => convertToSCDomain,
  convertToSiteUrl: () => convertToSiteUrl,
  fetchRetry: () => fetchRetry,
  getAccessToken: () => getAccessToken,
  getEmojiForStatus: () => getEmojiForStatus,
  getPageIndexingStatus: () => getPageIndexingStatus,
  getPublishMetadata: () => getPublishMetadata,
  getSitemapPages: () => getSitemapPages,
  getSites: () => getSites,
  index: () => index,
  requestIndexing: () => requestIndexing
});
var import_fs2, import_path2, CACHE_TIMEOUT, QUOTA2, index;
var init_index = __esm({
  "index.ts"() {
    "use strict";
    import_fs2 = require("fs");
    import_path2 = __toESM(require("path"));
    init_src();
    init_src();
    CACHE_TIMEOUT = 1e3 * 60 * 60 * 24 * 14;
    QUOTA2 = {
      rpm: {
        retries: 3,
        waitingTime: 6e4
        // 1 minute
      }
    };
    index = async (input = process.argv[2], options = {}) => {
      if (!input) {
        console.error("\u274C Please provide a domain or site URL as the first argument.");
        console.error("");
        process.exit(1);
      }
      if (!options.client_email) {
        options.client_email = process.env.GSC_CLIENT_EMAIL;
      }
      if (!options.private_key) {
        options.private_key = process.env.GSC_PRIVATE_KEY;
      }
      if (!options.path) {
        options.path = process.env.GSC_PATH;
      }
      if (!options.urls) {
        options.urls = process.env.GSC_URLS ? process.env.GSC_URLS.split(",") : void 0;
      }
      if (!options.quota) {
        options.quota = {
          rpmRetry: process.env.GSC_QUOTA_RPM_RETRY === "true"
        };
      }
      const accessToken = await getAccessToken(options.client_email, options.private_key, options.path);
      let siteUrl = convertToSiteUrl(input);
      console.log(`\u{1F50E} Processing site: ${siteUrl}`);
      const cachePath = import_path2.default.join(".cache", `${convertToFilePath(siteUrl)}.json`);
      if (!accessToken) {
        console.error("\u274C Failed to get access token, check your service account credentials.");
        console.error("");
        process.exit(1);
      }
      siteUrl = await checkSiteUrl(accessToken, siteUrl);
      let pages = options.urls || [];
      if (pages.length === 0) {
        console.log(`\u{1F50E} Fetching sitemaps and pages...`);
        const [sitemaps, pagesFromSitemaps] = await getSitemapPages(accessToken, siteUrl);
        if (sitemaps.length === 0) {
          console.error("\u274C No sitemaps found, add them to Google Search Console and try again.");
          console.error("");
          process.exit(1);
        }
        pages = pagesFromSitemaps;
        console.log(`\u{1F449} Found ${pages.length} URLs in ${sitemaps.length} sitemap`);
      } else {
        pages = checkCustomUrls(siteUrl, pages);
        console.log(`\u{1F449} Found ${pages.length} URLs in the provided list`);
      }
      const statusPerUrl = (0, import_fs2.existsSync)(cachePath) ? JSON.parse((0, import_fs2.readFileSync)(cachePath, "utf8")) : {};
      const pagesPerStatus = {
        ["Submitted and indexed" /* SubmittedAndIndexed */]: [],
        ["Duplicate without user-selected canonical" /* DuplicateWithoutUserSelectedCanonical */]: [],
        ["Crawled - currently not indexed" /* CrawledCurrentlyNotIndexed */]: [],
        ["Discovered - currently not indexed" /* DiscoveredCurrentlyNotIndexed */]: [],
        ["Page with redirect" /* PageWithRedirect */]: [],
        ["URL is unknown to Google" /* URLIsUnknownToGoogle */]: [],
        ["RateLimited" /* RateLimited */]: [],
        ["Forbidden" /* Forbidden */]: [],
        ["Error" /* Error */]: []
      };
      const indexableStatuses = [
        "Discovered - currently not indexed" /* DiscoveredCurrentlyNotIndexed */,
        "Crawled - currently not indexed" /* CrawledCurrentlyNotIndexed */,
        "URL is unknown to Google" /* URLIsUnknownToGoogle */,
        "Forbidden" /* Forbidden */,
        "Error" /* Error */,
        "RateLimited" /* RateLimited */
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
            result = { status, lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString() };
            statusPerUrl[url] = result;
          }
          pagesPerStatus[result.status] = pagesPerStatus[result.status] ? [...pagesPerStatus[result.status], url] : [url];
        },
        pages,
        50,
        (batchIndex, batchCount) => {
          console.log(`\u{1F4E6} Batch ${batchIndex + 1} of ${batchCount} complete`);
        }
      );
      console.log(``);
      console.log(`\u{1F44D} Done, here's the status of all ${pages.length} pages:`);
      (0, import_fs2.mkdirSync)(".cache", { recursive: true });
      (0, import_fs2.writeFileSync)(cachePath, JSON.stringify(statusPerUrl, null, 2));
      for (const status of Object.keys(pagesPerStatus)) {
        const pages2 = pagesPerStatus[status];
        if (pages2.length === 0) continue;
        console.log(`\u2022 ${getEmojiForStatus(status)} ${status}: ${pages2.length} pages`);
      }
      console.log("");
      const indexablePages = Object.entries(pagesPerStatus).flatMap(
        ([status, pages2]) => indexableStatuses.includes(status) ? pages2 : []
      );
      if (indexablePages.length === 0) {
        console.log(`\u2728 There are no pages that can be indexed. Everything is already indexed!`);
      } else {
        console.log(`\u2728 Found ${indexablePages.length} pages that can be indexed.`);
        indexablePages.forEach((url) => console.log(`\u2022 ${url}`));
      }
      console.log(``);
      for (const url of indexablePages) {
        console.log(`\u{1F4C4} Processing url: ${url}`);
        const status = await getPublishMetadata(accessToken, url, {
          retriesOnRateLimit: options.quota.rpmRetry ? QUOTA2.rpm.retries : 0
        });
        if (status === 404) {
          await requestIndexing(accessToken, url);
          console.log("\u{1F680} Indexing requested successfully. It may take a few days for Google to process it.");
        } else if (status < 400) {
          console.log(`\u{1F55B} Indexing already requested previously. It may take a few days for Google to process it.`);
        }
        console.log(``);
      }
      console.log(`\u{1F44D} All done!`);
      console.log(`\u{1F496} Brought to you by https://seogets.com - SEO Analytics.`);
      console.log(``);
    };
  }
});

// package.json
var require_package = __commonJS({
  "package.json"(exports2, module2) {
    module2.exports = {
      name: "google-indexing-script",
      description: "Script to get your site indexed on Google in less than 48 hours",
      version: "0.4.0",
      main: "./index.ts",
      type: "commonjs",
      bin: {
        gsc: "bin/gsc"
      },
      scripts: {
        index: "ts-node ./src/cli.ts",
        build: "tsup",
        dev: "tsup --watch",
        link: "npm run build && npm i -g ."
      },
      keywords: [
        "google",
        "indexing",
        "search-console",
        "sitemap",
        "seo",
        "google-search",
        "cli",
        "typescript"
      ],
      license: "MIT",
      dependencies: {
        commander: "^12.1.0",
        googleapis: "131.0.0",
        picocolors: "^1.0.1",
        sitemapper: "3.2.8"
      },
      prettier: {
        printWidth: 120
      },
      devDependencies: {
        "ts-node": "^10.9.2",
        tsup: "^8.0.2",
        typescript: "^5.9.2"
      }
    };
  }
});

// cli.ts
var { index: index2 } = (init_index(), __toCommonJS(index_exports));
var { Command } = require("commander");
var packageJson = require_package();
var { green } = require("picocolors");
var program = new Command(packageJson.name);
program.alias("gsc").version(packageJson.version, "-v, --version", "Hi\u1EC3n th\u1ECB version.").description(packageJson.description).argument("[input]").usage(`${green("[input]")} [options]`).helpOption("-h, --help", "Hi\u1EC3n th\u1ECB th\xF4ng tin h\u01B0\u1EDBng d\u1EABn.").option("-c, --client-email <email>", "\u0110\u1ECBa ch\u1EC9 email c\u1EE7a t\xE0i kho\u1EA3n d\u1ECBch v\u1EE5 Google.").option("-k, --private-key <key>", "Kho\xE1 ri\xEAng (private key) c\u1EE7a t\xE0i kho\u1EA3n d\u1ECBch v\u1EE5 Google.").option("-p, --path <path>", "\u0110\u01B0\u1EDDng d\u1EABn t\u1EDBi file ch\u1EE9a th\xF4ng tin x\xE1c th\u1EF1c c\u1EE7a t\xE0i kho\u1EA3n d\u1ECBch v\u1EE5 Google.").option("-u, --urls <urls>", "Danh s\xE1ch URL c\u1EA7n index, ph\xE2n t\xE1ch b\u1EB1ng d\u1EA5u ph\u1EA9y.").option("--rpm-retry", "Th\u1EED l\u1EA1i khi v\u01B0\u1EE3t qu\xE1 gi\u1EDBi h\u1EA1n t\u1EA7n su\u1EA5t (rate limit).").action((input, options) => {
  index2(input, {
    client_email: options.clientEmail,
    private_key: options.privateKey,
    path: options.path,
    urls: options.urls ? options.urls.split(",") : void 0,
    quota: {
      rpmRetry: options.rpmRetry
    }
  });
}).parse(process.argv);
//# sourceMappingURL=gsc.js.map