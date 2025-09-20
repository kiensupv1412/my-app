import { Router } from "express";
import { topQueries, topPages, totals } from "../controllers/analytics.controller";

const r = Router({ mergeParams: true });

// /api/sites/:siteUrl/analytics/queries
r.get("/:siteUrl/analytics/queries", topQueries);

// /api/sites/:siteUrl/analytics/pages
r.get("/:siteUrl/analytics/pages", topPages);

// /api/sites/:siteUrl/analytics/totals
r.get("/:siteUrl/analytics/totals", totals);

export default r;