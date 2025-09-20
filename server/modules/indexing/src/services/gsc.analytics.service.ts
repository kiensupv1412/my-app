import { searchconsole_v1 } from "@googleapis/searchconsole";
import type { OAuth2Client } from "google-auth-library";
import { getOAuthClientWithStoredTokens } from "./google.oauth.service";
import { getSearchConsoleClient } from "./google.client.service";

export type DateRange = { startDate: string; endDate: string };
export type Dimension = "query" | "page";

/**
 * Chạy searchanalytics.query cho 1 site
 */
async function runSearchAnalytics(
    siteUrl: string,
    range: DateRange,
    dimensions: Dimension[],
    rowLimit = 10
) {
    const sc = await getSearchConsoleClient();
    const resp = await sc.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate: range.startDate,
            endDate: range.endDate,
            dimensions,
            rowLimit,
        },
    });
    return resp.data.rows ?? [];
}

/** Top queries */
export async function getTopQueries(siteUrl: string, range: DateRange, rowLimit = 10) {
    const rows = await runSearchAnalytics(siteUrl, range, ["query"], rowLimit);
    return rows.map(r => ({
        query: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
    }));
}

/** Top pages */
export async function getTopPages(siteUrl: string, range: DateRange, rowLimit = 10) {
    const rows = await runSearchAnalytics(siteUrl, range, ["page"], rowLimit);
    return rows.map(r => ({
        page: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
    }));
}

/** Tổng hợp clicks / impressions (không dimension) */
export async function getTotals(siteUrl: string, range: DateRange) {
    const sc = await getSearchConsoleClient();
    const resp = await sc.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate: range.startDate,
            endDate: range.endDate,
            dimensions: [],
        },
    });
    const r = resp.data.rows?.[0];
    return {
        clicks: r?.clicks ?? 0,
        impressions: r?.impressions ?? 0,
        ctr: r?.ctr ?? 0,
        position: r?.position ?? 0,
    };
}