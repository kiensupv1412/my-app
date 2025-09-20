import type { Request, Response } from "express";
import { getTopQueries, getTopPages, getTotals } from "../services/gsc.analytics.service";

/** Parse range ?range=30d|7d|custom */
function parseRange(range: string | undefined): { startDate: string; endDate: string } {
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10); // yyyy-mm-dd
    let startDate = endDate;

    if (!range || range === "30d") {
        const d = new Date(today.getTime() - 30 * 86400000);
        startDate = d.toISOString().slice(0, 10);
    } else if (range === "7d") {
        const d = new Date(today.getTime() - 7 * 86400000);
        startDate = d.toISOString().slice(0, 10);
    }
    // custom có thể parse thêm query param khác (ví dụ ?startDate=&endDate=)

    return { startDate, endDate };
}

/** GET /api/sites/:siteUrl/analytics/queries?range=30d */
export async function topQueries(req: Request, res: Response) {
    const siteUrl = decodeURIComponent(String(req.params.siteUrl || ""));
    const range = parseRange(String(req.query.range || ""));
    const rowLimit = Number(req.query.limit || 10);

    try {
        const data = await getTopQueries(siteUrl, range, rowLimit);
        return res.json({ siteUrl, range, data });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "topQueries error" });
    }
}

/** GET /api/sites/:siteUrl/analytics/pages?range=30d */
export async function topPages(req: Request, res: Response) {
    const siteUrl = decodeURIComponent(String(req.params.siteUrl || ""));
    const range = parseRange(String(req.query.range || ""));
    const rowLimit = Number(req.query.limit || 10);

    try {
        const data = await getTopPages(siteUrl, range, rowLimit);
        return res.json({ siteUrl, range, data });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "topPages error" });
    }
}

/** GET /api/sites/:siteUrl/analytics/totals?range=30d */
export async function totals(req: Request, res: Response) {
    const siteUrl = decodeURIComponent(String(req.params.siteUrl || ""));
    const range = parseRange(String(req.query.range || ""));

    try {
        const data = await getTotals(siteUrl, range);
        return res.json({ siteUrl, range, data });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "totals error" });
    }
}