// path: /lib/swr.ts
import { SWRConfiguration } from 'swr';
import { AppError } from '@/lib/http'; // từ file lib/api.ts bạn vừa chuẩn hoá

export const swrConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    shouldRetryOnError: (err: unknown) => {
        const e = err as AppError | undefined;
        return !!e?.retryable; // [CHUẨN HÓA HOOK] chỉ retry khi lỗi cho phép
    },
    errorRetryCount: 3,
    errorRetryInterval: (count) => Math.min(1000 * 2 ** count, 8000), // backoff
};
