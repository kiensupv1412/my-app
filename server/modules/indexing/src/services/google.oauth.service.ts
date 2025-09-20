/*
 * path: server/modules/indexing/src/services/google.oauth.service.ts
 */
import { OAuth2Client, Credentials } from "google-auth-library";
import { getDb } from "../db/mongo";

export function createOAuthClient() {
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
    );
}

export function getAuthUrl(client: OAuth2Client) {
    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/indexing",
            "https://www.googleapis.com/auth/webmasters.readonly",
        ],
        include_granted_scopes: true, // (tuỳ chọn) gộp scope đã cấp trước đó
    });
}

export async function exchangeCodeForTokens(client: OAuth2Client, code: string) {
    const { tokens } = await client.getToken(code);
    return tokens;
}

export async function saveTokens(tokens: Credentials) {
    const db = getDb();
    const doc = {
        provider: "google",
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        idToken: tokens.id_token ?? null,
        scope: tokens.scope ?? null,
        tokenType: tokens.token_type ?? null,
        expiry: tokens.expiry_date ?? null,
        updatedAt: new Date(),
    };

    await db.collection("oauth_tokens").updateOne(
        { provider: "google" },
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
    );

    return doc;
}

export async function getStoredTokens(): Promise<Credentials | null> {
    const db = getDb();
    const doc = await db.collection("oauth_tokens").findOne({ provider: "google" });
    if (!doc) return null;

    return {
        access_token: doc.accessToken ?? undefined,
        refresh_token: doc.refreshToken ?? undefined,
        expiry_date: doc.expiry ?? undefined,
        scope: doc.scope ?? undefined,
        token_type: doc.tokenType ?? undefined,
        id_token: doc.idToken ?? undefined,
    } as Credentials;
}

export async function getOAuthClientWithStoredTokens(): Promise<OAuth2Client> {
    const client = createOAuthClient();
    const stored = await getStoredTokens();
    if (stored) client.setCredentials(stored);

    // lưu lại nếu Google refresh access_token
    client.on("tokens", async (tokens) => {
        const merged: Credentials = { ...stored, ...tokens };
        await saveTokens(merged);
    });

    return client;
}