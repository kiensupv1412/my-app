/*
 * path: server/modules/indexing/src/routes/auth.routes.ts
 */
import { Router } from "express";
import {
    authGoogleRedirect,
    authGoogleCallback,
    authStatus,        // add
} from "../controllers/auth.controller";

const router = Router();

router.get("/", authStatus);
router.get("/auth/google", authGoogleRedirect);
router.get("/auth/google/callback", authGoogleCallback);

export default router;