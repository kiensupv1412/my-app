'use client';
import useSWR from 'swr';
import { apiListMedia } from '@/lib/api';
import { PaginationMeta } from '@/types';

type MediaResp = { data: any[]; meta: PaginationMeta };
export function useMediaPage(page: number, limit: number, folderId?: number | null) {
    const key = ['media', page, limit, folderId ?? undefined] as const;

    const { data, error, isLoading, mutate } = useSWR<MediaResp>(
        key,
        () => apiListMedia({ page, limit, folder_id: folderId ?? undefined }),
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    return {
        data: data?.data ?? [],
        meta: data?.meta ?? { page, limit, pages: 1, total: 0, prev: null, next: null },
        error,
        mediaLoading: isLoading,
        mutate,
    };
}