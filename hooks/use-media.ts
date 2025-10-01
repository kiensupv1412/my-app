'use client';
import useSWR from 'swr';
import { MediaItem } from '@/types';
import { apiListMedia } from '@/lib/media.api';

type Meta = {
    page: number;
    pages: number;
    limit: number;
    total: number | null;
    prev: number | null;
    next: number | null;
};

type MediaResp = {
    data: MediaItem[];
    meta: Meta;
};

/** ✅ Lấy MỘT TRANG media theo page/limit */
export function useMediaPage(page = 1, limit = 48, folderId?: number | null) {
    const key = ['media', page, limit, folderId] as const;

    const { data, error, isLoading, mutate } = useSWR<MediaResp>(
        key,
        () => apiListMedia({ page, limit, folder_id: folderId }),
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    const items: MediaItem[] = Array.isArray(data?.data) ? data!.data : [];

    const meta: Meta = {
        page: Number(data?.meta?.page ?? page),
        pages: Number(data?.meta?.pages ?? 1),
        limit: Number(data?.meta?.limit ?? limit),
        total: data?.meta?.total ?? 0,
        prev: data?.meta?.prev ?? null,
        next: data?.meta?.next ?? null,
    };

    return { data: items, meta, error, isLoading, mutate };
}