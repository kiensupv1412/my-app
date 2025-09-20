import { google, indexing_v3, searchconsole_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getOAuthClientWithStoredTokens } from "./google.oauth.service";

/** Client Indexing API */
export async function getIndexingClient(): Promise<indexing_v3.Indexing> {
    const auth: OAuth2Client = await getOAuthClientWithStoredTokens();
    return google.indexing({ version: "v3", auth });
}

/** Client Search Console API */
export async function getSearchConsoleClient(): Promise<searchconsole_v1.Searchconsole> {
    const auth: OAuth2Client = await getOAuthClientWithStoredTokens();
    return google.searchconsole({ version: "v1", auth });
}