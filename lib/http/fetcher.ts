// lib/http/fetcher.ts
import type { Key as SWRKey } from 'swr';
import { keyToUrl } from './url';
import { http } from './http';

type SwrContext = { signal?: AbortSignal };

export const swrFetcher = async (
    key: SWRKey | string,
    ctx?: SwrContext
) => {
    const url = typeof key === 'string' ? key : keyToUrl(key);
    // http.get() đã cấu hình credentials: 'include' ở trong
    return http.get(url, { signal: ctx?.signal as any });
};
