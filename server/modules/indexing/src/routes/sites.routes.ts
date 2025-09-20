import { Router } from "express";
import { getAllSites, getOwnedSites, checkDomain } from "../controllers/sites.controller";

const r = Router();

// GET /api/indexing/sites           -> liệt kê tất cả property GSC của user (domain + urlPrefix)
r.get("/sites", getAllSites);

// GET /api/indexing/sites/owned     -> chỉ những property có quyền Owner/FullUser
r.get("/sites/owned", getOwnedSites);

// GET /api/indexing/sites/check?domain=tuvibattu.vn
r.get("/sites/check", checkDomain);

export default r;