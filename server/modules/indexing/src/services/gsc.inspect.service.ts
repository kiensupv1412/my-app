import { getSearchConsoleClient } from "./google.client.service";
import { logApiCall } from "./log.service";

/** Gọi URL Inspection API theo property cụ thể (siteUrl) */
export async function inspectUrlByProperty(
    siteUrl: string,
    inspectionUrl: string,
    opts: SiteInspectOptions = {}) {
    const languageCode = opts.languageCode ?? "vi-VN";
    const timeoutMs = opts.timeoutMs ?? 15000;

    const sc = await getSearchConsoleClient();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    const reqBody = { siteUrl, inspectionUrl, languageCode };

    try {
        const resp = await sc.urlInspection.index.inspect(
            { requestBody: reqBody },
            { signal: ctrl.signal as any }
        );

        const data = resp.data ?? {};
        const r = data.inspectionResult ?? {};
        const idx = r.indexStatusResult ?? {};
        const mobile = r.mobileUsabilityResult ?? {};
        const rich = r.richResultsResult ?? {};

        const normalized = {
            url: inspectionUrl,
            siteUrl,
            verdict: r.verdict ?? null,
            coverage: {
                coverageState: idx.coverageState ?? null,
                indexingState: idx.indexingState ?? null,
                lastCrawlTime: idx.lastCrawlTime ?? null,
                pageFetchState: idx.pageFetchState ?? null,
                robotsTxtState: idx.robotsTxtState ?? null,
                crawledAs: idx.crawledAs ?? null,
                googleCanonical: idx.googleCanonical ?? null,
                userCanonical: idx.userCanonical ?? null,
                sitemaps: idx.sitemap ?? [],
                referringUrls: idx.referringUrls ?? [],
            },
            mobile: {
                verdict: mobile.verdict ?? null,
                issues: mobile.issues ?? [],
            },
            richResults: rich ?? null,
            link: r.inspectionResultLink ?? null,
            lastInspected: Date.now(),
            ...(opts.includeRaw ? { _raw: data } : {}),
        };

        // ✅ log thành công
        await logApiCall({
            endpoint: "sites.inspect",
            url: inspectionUrl,
            reqBody,
            status: resp.status,
            resBody: data,
        });

        return normalized;
    } catch (err: any) {
        // ❌ log lỗi
        await logApiCall({
            endpoint: "sites.inspect",
            url: inspectionUrl,
            reqBody,
            status: err.code || 500,
            resBody: err.errors || err.message,
        });
        throw err;
    } finally {
        clearTimeout(timer);
    }
}