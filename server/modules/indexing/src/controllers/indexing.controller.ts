import type { Request, Response } from "express";
import { getMetadata, publishNotification, type IndexingNotifyType } from "../services/indexing.service";

/** Validate URL đơn giản (http/https) */
function isValidHttpUrl(u: string) {
    try {
        const x = new URL(u);
        return x.protocol === "http:" || x.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * GET /api/indexing/status?url=...
 * Trả metadata Indexing API cho URL
 */
export async function status(req: Request, res: Response) {
    const url = String(req.query.url || "");
    if (!url || !isValidHttpUrl(url)) {
        return res.status(400).json({ error: "Missing or invalid ?url=" });
    }

    try {
        const meta = await getMetadata(url);
        return res.json(meta);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "status error" });
    }
}

/**
 * POST /api/indexing/publish
 * body: { url: string, type?: 'URL_UPDATED'|'URL_DELETED', skipIfNot48h?: boolean }
 * - Nếu type=URL_UPDATED và lần submit gần nhất (<48h) thì bỏ qua (tránh spam)
 */
export async function publish(req: Request, res: Response) {
    const { url, type = "URL_UPDATED", skipIfNot48h = true } = (req.body || {}) as {
        url?: string;
        type?: IndexingNotifyType;
        skipIfNot48h?: boolean;
    };

    if (!url || !isValidHttpUrl(url)) {
        return res.status(400).json({ error: "Missing or invalid body.url" });
    }
    if (type !== "URL_UPDATED" && type !== "URL_DELETED") {
        return res.status(400).json({ error: "Invalid body.type (must be URL_UPDATED or URL_DELETED)" });
    }

    try {
        // Chặn spam cho URL_UPDATED trong vòng 48h từ lần notify gần nhất
        if (type === "URL_UPDATED" && skipIfNot48h) {
            const meta = await getMetadata(url);
            const last = meta?.latestUpdate?.notifyTime;
            const updated = meta?.latestUpdate?.type === "URL_UPDATED";
            const within48h =
                last ? new Date(last).getTime() > Date.now() - 48 * 3600 * 1000 : false;

            if (updated && within48h) {
                return res.json({
                    status: "already-submitted",
                    url,
                    latestUpdate: meta?.latestUpdate ?? null,
                });
            }
        }

        const out = await publishNotification(url, type);
        return res.json({ status: "submitted", url, type, response: out });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "publish error" });
    }
}