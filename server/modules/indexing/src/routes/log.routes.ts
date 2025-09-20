// server/modules/indexing/src/routes/log.routes.ts
import { Router } from "express";
import { listLogs } from "../controllers/log.controller";

const r = Router();
r.get("/logs", listLogs);

export default r;