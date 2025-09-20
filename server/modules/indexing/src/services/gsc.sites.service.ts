import { OAuth2Client } from "google-auth-library";
import { searchconsole_v1 } from "@googleapis/searchconsole";
import { saveTokens } from "./google.oauth.service";
import { getDb } from "../db/mongo";
import { getSearchConsoleClient } from "./google.client.service";

type GscSiteEntry = searchconsole_v1.Schema$WmxSite;

export type NormalizedSite = {
    siteUrl: string;
    permissionLevel: string; // siteOwner | siteFullUser | siteRestrictedUser | siteUnverifiedUser
    type: "domain" | "urlPrefix";
    origin?: string;   // với urlPrefix, ví dụ: https://tuvibattu.vn/
    hostname?: string; // hostname, ví dụ: tuvibattu.vn
};

function isOwnedPermission(p: string | undefined | null) {
    // "Sở hữu" ở đây coi như có full quyền: Owner hoặc FullUser
    return p === "siteOwner" || p === "siteFullUser";
}

function normalizeEntry(entry: GscSiteEntry): NormalizedSite {
    const raw = entry.siteUrl || "";
    if (raw.startsWith("sc-domain:")) {
        const hostname = raw.replace("sc-domain:", "");
        return {
            siteUrl: raw,
            permissionLevel: entry.permissionLevel || "unknown",
            type: "domain",
            hostname,
        };
    }
    // URL-prefix
    try {
        const u = new URL(raw);
        return {
            siteUrl: raw,
            permissionLevel: entry.permissionLevel || "unknown",
            type: "urlPrefix",
            origin: `${u.protocol}//${u.hostname}/`,
            hostname: u.hostname,
        };
    } catch {
        // fallback thô, vẫn trả siteUrl để debug
        return {
            siteUrl: raw,
            permissionLevel: entry.permissionLevel || "unknown",
            type: "urlPrefix",
        };
    }
}



export async function listSitesRaw() {
    const sc = await getSearchConsoleClient();
    const resp = await sc.sites.list();
    return resp.data?.siteEntry ?? [];
}

export async function listSitesNormalized(): Promise<NormalizedSite[]> {
    const entries = await listSitesRaw();
    return entries.map(normalizeEntry);
}

export async function listOwnedSites(): Promise<NormalizedSite[]> {
    const all = await listSitesNormalized();
    return all.filter(s => isOwnedPermission(s.permissionLevel));
}

/**
 * Kiểm tra 1 domain (vd: "tuvibattu.vn") có thuộc sở hữu (owner/full) không.
 * - Match domain-property: "sc-domain:tuvibattu.vn" (đúng 100%)
 * - Match url-prefix property: hostname === domain (ví dụ https://tuvibattu.vn/),
 *   hoặc subdomain thuộc domain (tuỳ mày có muốn chấp nhận *.domain không; ở đây match đúng hostname).
 */
export async function checkDomainOwned(domain: string) {
    const owned = await listOwnedSites();

    // 1) Có domain-property?
    const hasDomainProp = owned.some(s => s.type === "domain" && s.hostname === domain);

    // 2) Có url-prefix trùng hostname?
    const hasUrlPrefix = owned.some(s => s.type === "urlPrefix" && s.hostname === domain);

    return {
        domain,
        owned: hasDomainProp || hasUrlPrefix,
        via: {
            domainProperty: hasDomainProp,
            urlPrefixProperty: hasUrlPrefix,
        },
        // Gợi ý các property liên quan (cho UI)
        related: owned.filter(s => s.hostname === domain).map(s => ({
            siteUrl: s.siteUrl,
            type: s.type,
            permissionLevel: s.permissionLevel,
            origin: s.origin,
        })),
    };
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