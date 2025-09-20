/*
 * path: server/modules/indexing/src/controllers/auth.controller.ts
 */

import type { Request, Response } from "express";
import {
    createOAuthClient,
    getAuthUrl,
    exchangeCodeForTokens,
    saveTokens,
    getStoredTokens
} from "../services/google.oauth.service";

const SKEW_MS = 60_000; // buffer 60s

export async function authStatus(_req: Request, res: Response) {
    try {
        const tokens = await getStoredTokens();
        if (!tokens) {
            return res.json({ ok: false, reason: "no_token" });
        }

        const now = Date.now();
        const expiry = tokens.expiry_date ?? 0;
        const hasAccess = !!tokens.access_token;

        // chỉ check thời gian, không refresh
        const stillValid = hasAccess && expiry > now + SKEW_MS;
        const remainingMs = Math.max(0, expiry - now);

        return res.json({
            ok: stillValid,
            reason: stillValid ? "valid" : "expired_or_missing",
            details: {
                hasAccessToken: hasAccess,
                hasRefreshToken: !!tokens.refresh_token,
                expiry,               // epoch ms
                remainingMs,          // ms còn lại (0 nếu hết)
                remainingSec: Math.floor(remainingMs / 1000),
                scope: tokens.scope,
                tokenType: tokens.token_type,
            },
        });
    } catch (e: any) {
        return res.status(500).json({ ok: false, error: e?.message || "status error" });
    }
}

export async function authGoogleRedirect(_req: Request, res: Response) {
    try {
        const client = createOAuthClient();
        const url = getAuthUrl(client);
        return res.redirect(url);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "auth redirect error" });
    }
}

export async function authGoogleCallback(req: Request, res: Response) {
    const code = String(req.query.code || "");
    if (!code) return res.status(400).json({ error: "Missing ?code" });

    try {
        const client = createOAuthClient();
        const tokens = await exchangeCodeForTokens(client, code);
        const saved = await saveTokens(tokens);
        return res.json({ success: true, tokens: { ...saved, accessToken: !!saved.accessToken } });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || "auth callback error" });
    }
}