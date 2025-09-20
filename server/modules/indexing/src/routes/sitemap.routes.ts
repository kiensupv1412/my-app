import { Router } from "express";
import { getRobots, getSitemap } from "../controllers/sitemap.controller";

const r = Router();

// /api/sites/:siteUrl/robots
r.get("/:siteUrl/robots", getRobots);

// /api/sites/:siteUrl/sitemap?url=...
r.get("/:siteUrl/sitemap", getSitemap);

export default r;