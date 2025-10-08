/*
 * path: hooks/use-media.ts
 */
'use client';
import useSWR from 'swr';
import { apiListMedia } from '@/lib/api';
import type { PaginationMeta, MediaItem } from '@/types';
import type { AppError } from '@/lib/http'; // [CHANGE] dùng AppError chuẩn hoá

type MediaResp = { data: MediaItem[]; meta: PaginationMeta };

export function useMediaPage(
    page: number,
    limit: number,
    folderId?: number | null,
    opts?: { onError?: (e: AppError) => void } // [OPTIONAL] cho phép UI gắn side-effect
) {
    // [KEEP] key ổn định, không đổi hành vi
    const key = ['media', page, limit, folderId ?? 'all'] as const;

    const {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
    } = useSWR<MediaResp, AppError>(
        key,
        () => apiListMedia({ page, limit, folder_id: folderId ?? undefined }),
        {
            onError: (e) => opts?.onError?.(e), // [OPTIONAL] không toast ở hook, chỉ pass ra
        }
    );

    return {
        data: data?.data ?? [],
        meta:
            data?.meta ?? {
                page,
                limit,
                pages: 1,
                total: 0,
                prev: null,
                next: null,
            },
        error,                           // [CHANGE] AppError => UI đọc message/kind/status
        canRetry: !!error?.retryable,    // [ADD] tiện cho nút “Thử lại”
        mediaLoading: isLoading,         // [KEEP] không phá call-site
        isValidating,                    // [ADD] phân biệt loading lần đầu vs revalidate
        mutate,
    };
}
