import type { Key as SWRKey } from "swr";

export function qs(params: Record<string, string | number | null | undefined>) {
    const parts: string[] = [];
    for (const k in params) {
        const v = params[k];
        if (v === undefined || v === null) continue;
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
    }
    return parts.length ? "?" + parts.join("&") : "";
}

export function keyToUrl(key: SWRKey): string {
    if (typeof key === "string") return key;
    if (Array.isArray(key)) {
        const [base, params] = key as [string, Record<string, any>?];
        return params ? base + qs(params) : base;
    }
    return String(key);
}