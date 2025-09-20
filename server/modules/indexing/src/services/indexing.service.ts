import { google } from "googleapis";
import type { index_v3 } from "googleapis";
import { getOAuthClientWithStoredTokens } from "./google.oauth.service";
import { logApiCall } from "./log.service";

export type IndexingNotifyType = "URL_UPDATED" | "URL_DELETED";

async function client(): Promise<index_v3.Indexing> {
    const auth = await getOAuthClientWithStoredTokens();
    return google.indexing({ version: "v3", auth });
}

/** GET metadata của URL từ Indexing API */
export async function getMetadata(url: string) {
    const c = await client();
    try {
        const res = await c.urlNotifications.getMetadata({ url });
        await logApiCall({ endpoint: "indexing.status", url, status: res.status, resBody: res.data });
        return res.data;
    } catch (err: any) {
        await logApiCall({ endpoint: "indexing.status", url, status: err.code || 500, resBody: err.errors || err.message });
        throw err;
    }
}

/** Publish thông báo (URL_UPDATED/URL_DELETED) tới Indexing API */
export async function publishNotification(url: string, type: IndexingNotifyType = "URL_UPDATED") {
    const c = await client();
    const body = { url, type };
    try {
        const res = await c.urlNotifications.publish({ requestBody: body });
        await logApiCall({ endpoint: "indexing.publish", url, reqBody: body, status: res.status, resBody: res.data });
        return res.data;
    } catch (err: any) {
        await logApiCall({ endpoint: "indexing.publish", url, reqBody: body, status: err.code || 500, resBody: err.errors || err.message });
        throw err;
    }
}