import type { Request, Response } from "express";

import { inspectUrlByProperty } from "../services/gsc.inspect.service";

export async function inspectUrl(req: Request, res: Response) {
    const siteUrl = decodeURIComponent(String(req.params.siteUrl || ""));
    const url = decodeURIComponent(String(req.params.url || ""));

    if (!siteUrl || !url) {
        return res.status(400).json({ error: "Missing params :siteUrl or :url" });
    }

    try {
        const data = await inspectUrlByProperty(siteUrl, url, { languageCode: "vi-VN" });
        return res.json(data); // data đã có lastInspected
    } catch (e: any) {
        const code = e?.code || e?.response?.status;
        if (code === 401) return res.status(401).json({ error: "Unauthorized" });
        if (code === 500) return res.status(500).json({ error: "Google rate limiting, try later." });
        return res.status(500).json({ error: e?.message || "siteInspect error" });
    }
}