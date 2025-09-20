import type { Request, Response } from "express";
import { listSitesNormalized, listOwnedSites, checkDomainOwned } from "../services/gsc.sites.service";

export async function getAllSites(_req: Request, res: Response) {
    try {
        const items = await listSitesNormalized();
        const counts = items.reduce(
            (acc, s) => {
                acc.total++;
                if (s.type === "domain") acc.domain++;
                else acc.urlPrefix++;
                if (s.permissionLevel === "siteOwner") acc.owner++;
                if (s.permissionLevel === "siteFullUser") acc.full++;
                return acc;
            },
            { total: 0, domain: 0, urlPrefix: 0, owner: 0, full: 0 }
        );

        return res.json({ counts, items });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "sites list error" });
    }
}

export async function getOwnedSites(_req: Request, res: Response) {
    try {
        const items = await listOwnedSites();
        return res.json({ total: items.length, items });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "sites owned error" });
    }
}

export async function checkDomain(req: Request, res: Response) {
    const domain = String(req.query.domain || "").trim().toLowerCase();
    if (!domain) return res.status(400).json({ error: "Missing ?domain=" });
    // Optional: validate domain format rất đơn giản
    if (!/^[a-z0-9.-]+$/.test(domain)) return res.status(400).json({ error: "Invalid domain" });

    try {
        const result = await checkDomainOwned(domain);
        return res.json(result);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "sites check error" });
    }
}
