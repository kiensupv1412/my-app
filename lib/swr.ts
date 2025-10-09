// lib/swr.ts
import type { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    dedupingInterval: 300,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    shouldRetryOnError: (err: any) => !!err?.retryable, // chỉ retry lỗi tạm thời
};