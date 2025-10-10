// lib/http/fetcher.ts
import type { Key as SWRKey } from 'swr';
import { keyToUrl } from './url';
import { apiFetch, http } from './http';

type SwrContext = { signal?: AbortSignal };

export const swrFetcher = async (
    key: SWRKey | string,
    token?: string | null,
    ctx?: SwrContext
) => {
    const url = typeof key === 'string' ? key : keyToUrl(key);
    return http.get(url, { token: token ?? undefined, signal: ctx?.signal as any });
};