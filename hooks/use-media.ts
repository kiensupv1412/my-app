'use client';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { swrFetcher, type AppError, http } from '@/lib/http';
import type { PaginationMeta, MediaItem } from '@/types';
import { k } from '@/lib/keys';

type MediaResp = { data: MediaItem[]; meta: PaginationMeta };

export function useMediaPage(
    page: number,
    limit: number,
    folderId?: number | null,
    opts?: { onError?: (e: AppError) => void }
) {
    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const key = token ? k.media(page, limit, (folderId ?? 'all') as any, token) : null;

    // Lấy mutate riêng (không dùng swr.mutate)
    const {
        data: swrData,
        error,
        isLoading,
        mutate,               // << dùng biến mutate này
        isValidating,
    } = useSWR<MediaResp, AppError>(key, (key, ctx) => swrFetcher(key, token, ctx), {
        keepPreviousData: true,
        onError: opts?.onError,
    });

    const data = swrData?.data ?? [];
    const meta: PaginationMeta = {
        page: Number(swrData?.meta?.page ?? page),
        limit: Number(swrData?.meta?.limit ?? limit),
        pages: Math.max(1, Number(swrData?.meta?.pages ?? 1) || 1),
        total: typeof swrData?.meta?.total === 'number' ? swrData.meta.total : 0,
        prev: swrData?.meta?.prev ?? null,
        next: swrData?.meta?.next ?? null,
    };

    // DELETE — API OK rồi mới update UI (không optimistic)
    async function remove(id: number | string) {
        if (!token) throw new Error('Chưa đăng nhập');
        await http.delete(`/media/${id}`, { method: 'DELETE', token }); // chờ server OK
        await mutate((cur) => {
            if (!cur) return cur;
            const next = (cur.data ?? []).filter((m) => String(m.id) !== String(id));
            const total = Math.max(0, (cur.meta?.total ?? 0) - 1);
            return { ...cur, data: next, meta: { ...(cur.meta ?? {}), total } };
        }, false);
        // hoặc dùng revalidate thật nếu muốn chắc tuyệt đối:
        // await mutate(undefined, true);
    }

    return {
        data,
        meta,
        error,
        isLoading,
        isValidating,
        canRetry: !!error?.retryable,
        mutate,
        remove,
    };
}