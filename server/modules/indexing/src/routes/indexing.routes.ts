import { Router } from "express";
import { status, publish } from "../controllers/indexing.controller";

const r = Router();

// GET /api/indexing/status?url=...
r.get("/status", status);

// POST /api/indexing/publish  { url, type?, skipIfNot48h? }
r.post("/publish", publish);

export default r;