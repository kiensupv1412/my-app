import { AppError } from "./errors";
import { joinBase } from "./constants";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiInit = Omit<RequestInit, "body" | "method" | "headers"> & {
    method?: HttpMethod;
    headers?: Record<string, string>;
    json?: any;                 // body json
    token?: string | null;      // bearer token
    timeoutMs?: number;         // abort timeout
    retry?: { attempts?: number; baseDelayMs?: number; onRetry?: (e: any, n: number) => void };
};

function mapStatusToKind(status: number) {
    if (status === 401) return "unauthorized";
    if (status === 403) return "forbidden";
    if (status === 404) return "not_found";
    if (status === 422) return "validation";
    if (status === 429) return "rate_limit";
    if (status >= 500) return "server";
    return "unknown";
}

async function safeJson<T = any>(res: Response): Promise<T | undefined> {
    const text = await res.text();
    if (!text) return undefined as any;
    try { return JSON.parse(text) as T; } catch { return undefined as any; }
}

function normalizeErrorMessage(payload: any, fallback: string): string {
    if (!payload) return fallback;
    if (typeof payload === "string") return payload;
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.error === "string") return payload.error;
    if (payload?.errors && typeof payload.errors === "object") {
        try { return Object.values(payload.errors).flat().join("; "); } catch { }
    }
    return fallback;
}

export async function apiFetch<T = any>(path: string, init: ApiInit = {}): Promise<T> {
    const {
        method = "GET",
        headers = {},
        json,
        token,
        timeoutMs = 15000,
        retry = { attempts: 0, baseDelayMs: 300 },
        ...rest
    } = init;

    const url = joinBase(path);

    let controller: AbortController | null = null;
    let timeout: any = null;
    if (timeoutMs > 0) {
        controller = new AbortController();
        timeout = setTimeout(() => controller!.abort(), timeoutMs);
    }

    const baseHeaders: Record<string, string> = {
        Accept: "application/json",
        ...headers,
    };
    if (json !== undefined) baseHeaders["Content-Type"] = "application/json";
    if (token) baseHeaders["Authorization"] = `Bearer ${token}`;

    const req: RequestInit = {
        method,
        credentials: "include",
        cache: "no-store",
        headers: baseHeaders,
        body: json !== undefined ? JSON.stringify(json) : undefined,
        signal: controller?.signal,
        ...rest,
    };

    const doOnce = async () => {
        let res: Response;
        try {
            res = await fetch(url, req);
        } catch (e: any) {
            throw new AppError("Network error", "network", { retryable: true, details: e });
        } finally {
            if (timeout) clearTimeout(timeout);
        }

        const payload = await safeJson<any>(res);
        if (!res.ok) {
            const msg = normalizeErrorMessage(payload, `HTTP ${res.status}`);
            const kind = mapStatusToKind(res.status) as any;
            const retryable = kind === "rate_limit" || res.status === 503 || kind === "network";
            throw new AppError(msg, kind, { status: res.status, retryable, details: payload });
        }
        return (payload as T) ?? (undefined as any);
    };

    const attempts = Math.max(0, retry.attempts ?? 0);
    if (attempts === 0) return doOnce();

    // retry với backoff đơn giản
    let lastErr: any;
    for (let i = 0; i <= attempts; i++) {
        try {
            return await doOnce();
        } catch (e: any) {
            lastErr = e;
            if (!e?.retryable || i === attempts) break;
            retry.onRetry?.(e, i + 1);
            const delay = (retry.baseDelayMs ?? 300) * Math.pow(2, i);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastErr;
}

// sugar helpers
export const http = {
    get: <T>(path: string, init?: ApiInit) => apiFetch<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, json?: any, init?: ApiInit) => apiFetch<T>(path, { ...init, method: "POST", json }),
    put: <T>(path: string, json?: any, init?: ApiInit) => apiFetch<T>(path, { ...init, method: "PUT", json }),
    patch: <T>(path: string, json?: any, init?: ApiInit) => apiFetch<T>(path, { ...init, method: "PATCH", json }),
    del: <T>(path: string, init?: ApiInit) => apiFetch<T>(path, { ...init, method: "DELETE" }),
};