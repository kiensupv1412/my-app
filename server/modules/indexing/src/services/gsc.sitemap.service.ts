import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

/** Crawl robots.txt, parse directive & sitemap entries */
export async function fetchRobotsTxt(siteUrl: string) {
    let base: string;
    try {
        const u = new URL(siteUrl);
        base = `${u.protocol}//${u.hostname}`;
    } catch {
        throw new Error("Invalid siteUrl");
    }

    const robotsUrl = `${base}/robots.txt`;
    const resp = await fetch(robotsUrl, { timeout: 10000 as any });
    if (!resp.ok) throw new Error(`robots.txt fetch failed: ${resp.status}`);
    const text = await resp.text();

    const lines = text.split(/\r?\n/);
    const rules: { userAgent: string; allow: string[]; disallow: string[] }[] = [];
    let current = { userAgent: "*", allow: [] as string[], disallow: [] as string[] };
    const sitemaps: string[] = [];

    for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith("#")) continue;
        const [kRaw, vRaw] = clean.split(":", 2);
        if (!kRaw || !vRaw) continue;
        const key = kRaw.trim().toLowerCase();
        const value = vRaw.trim();

        if (key === "user-agent") {
            if (current.allow.length || current.disallow.length || current.userAgent !== "*") {
                rules.push(current);
            }
            current = { userAgent: value, allow: [], disallow: [] };
        } else if (key === "allow") {
            current.allow.push(value);
        } else if (key === "disallow") {
            current.disallow.push(value);
        } else if (key === "sitemap") {
            sitemaps.push(value);
        }
    }
    rules.push(current);

    return {
        url: robotsUrl,
        raw: text,
        rules,
        sitemaps,
    };
}

/** Crawl sitemap.xml và trả danh sách URL */
export async function fetchSitemapXml(sitemapUrl: string) {
    const resp = await fetch(sitemapUrl, { timeout: 15000 as any });
    if (!resp.ok) throw new Error(`sitemap fetch failed: ${resp.status}`);
    const xml = await resp.text();

    const parsed = await parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });

    // <urlset><url><loc>...</loc></url></urlset>
    // <sitemapindex><sitemap><loc>...</loc></sitemap></sitemapindex>
    const urls: string[] = [];
    if (parsed.urlset?.url) {
        const arr = Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url];
        for (const u of arr) urls.push(u.loc);
    }
    const sitemaps: string[] = [];
    if (parsed.sitemapindex?.sitemap) {
        const arr = Array.isArray(parsed.sitemapindex.sitemap)
            ? parsed.sitemapindex.sitemap
            : [parsed.sitemapindex.sitemap];
        for (const sm of arr) sitemaps.push(sm.loc);
    }

    return {
        url: sitemapUrl,
        urls,
        sitemaps,
        raw: xml,
    };
}