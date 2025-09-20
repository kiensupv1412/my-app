import type { Request, Response } from "express";
import { fetchRobotsTxt, fetchSitemapXml } from "../services/gsc.sitemap.service";

/** GET /api/sites/:siteUrl/robots */
export async function getRobots(req: Request, res: Response) {
    const siteUrl = decodeURIComponent(String(req.params.siteUrl || ""));
    if (!siteUrl) return res.status(400).json({ error: "Missing :siteUrl" });

    try {
        const data = await fetchRobotsTxt(siteUrl);
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "robots error" });
    }
}

/** GET /api/sites/:siteUrl/sitemap?url=... */
export async function getSitemap(req: Request, res: Response) {
    const sitemapUrl = String(req.query.url || "");
    if (!sitemapUrl) return res.status(400).json({ error: "Missing ?url=" });

    try {
        const data = await fetchSitemapXml(sitemapUrl);
        return res.json(data);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "sitemap error" });
    }
}