import { Router } from "express";
import { inspectUrl } from "../controllers/inspect.controller";

const r = Router();

/**
 * GET /api/sites/:siteUrl/:url
 * - :siteUrl và :url phải được encodeURIComponent từ client
 * - Server decode rồi gọi URL Inspection API theo property
 */
r.get("/:siteUrl/:url", inspectUrl);


export default r;