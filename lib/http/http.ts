// [GOM] apiBase + parse/normalize + apiFetch
import { AppError } from './errors';

export function apiBase(): string {
    let api = process.env.NEXT_PUBLIC_API_URL ? String(process.env.NEXT_PUBLIC_API_URL) : 'http://localhost:4000';
    // let api = '';
    while (api.endsWith('/')) api = api.slice(0, -1);
    return api;
}

async function safeJson<T = any>(res: Response): Promise<T | undefined> {
    const text = await res.text();
    if (!text) return undefined as any;
    try { return JSON.parse(text) as T; } catch { return undefined as any; }
}

function normalizeErrorMessage(payload: any, fallback: string): string {
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
    if (payload?.errors && typeof payload.errors === 'object') {
        try { return Object.values(payload.errors).flat().join('; '); } catch { }
    }
    return fallback;
}

function mapStatusToKind(status?: number) {
    if (!status) return 'unknown';
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate_limit';
    if (status >= 400 && status < 500) return 'validation';
    if (status >= 500) return 'server';
    return 'unknown';
}

export async function apiFetch<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(input, init);
    } catch (e: any) {
        throw new AppError('Network error', 'network', { retryable: true, details: e });
    }
    const payload = await safeJson<any>(res);
    if (!res.ok) {
        const msg = normalizeErrorMessage(payload, `HTTP ${res.status}`);
        const kind = mapStatusToKind(res.status) as any;
        const retryable = kind === 'rate_limit' || res.status === 503;
        throw new AppError(msg, kind, { status: res.status, retryable, details: payload });
    }
    return (payload as T) ?? (undefined as any);
}
