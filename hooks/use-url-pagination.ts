// ✅ API giữ nguyên:
// return { page, limit, pageCount, setPage, setLimit, goPrev, goNext }

'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Meta } from '@/types';

type Init = Meta | { page?: number; limit?: number } | undefined;

const parseIntSafe = (v: string | null, def: number, min = 1) =>
    Math.max(min, parseInt(v ?? `${def}`, 10) || def);

export function useUrlPagination(init?: Init) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Fallback khi URL không có
    const defaultPage = (init as any)?.page ?? 1;
    const defaultLimit = (init as any)?.limit ?? 10;

    // URL → state dẫn xuất (SSOT)
    const page = useMemo(
        () => parseIntSafe(searchParams.get('page'), defaultPage, 1),
        [searchParams, defaultPage]
    );
    const limit = useMemo(
        () => parseIntSafe(searchParams.get('limit'), defaultLimit, 1),
        [searchParams, defaultLimit]
    );

    // Meta từ server (nếu có)
    const meta = init as Meta | undefined;

    // Số trang: ưu tiên meta.pages; fallback từ total/limit
    const pageCount = useMemo(() => {
        if (typeof meta?.pages === 'number' && meta.pages > 0) return meta.pages;
        if (typeof meta?.total === 'number') return Math.max(1, Math.ceil(meta.total / Math.max(1, limit)));
        return undefined;
    }, [meta?.pages, meta?.total, limit]);

    // helper cập nhật URL
    const setQuery = useCallback((patch: Record<string, string | number>) => {
        const qs = new URLSearchParams(Array.from(searchParams.entries()));
        Object.entries(patch).forEach(([k, v]) => qs.set(k, String(v)));
        router.replace(`?${qs.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const setPage = useCallback((next: number) => {
        if (next < 1) return;
        if (pageCount && next > pageCount) return;
        setQuery({ page: next, limit });
    }, [limit, pageCount, setQuery]);

    const setLimit = useCallback((nextSize: number) => {
        if (!Number.isFinite(nextSize) || nextSize <= 0) return;
        setQuery({ page: 1, limit: Math.min(nextSize, 200) });
    }, [setQuery]);

    // goPrev/goNext: ưu tiên prev/next từ server meta; fallback tự tính
    const goPrev = useCallback(() => {
        const prev = (typeof meta?.prev === 'number' ? meta.prev : (page > 1 ? page - 1 : null));
        if (prev) setPage(prev);
    }, [meta?.prev, page, setPage]);

    const goNext = useCallback(() => {
        // Nếu meta có next -> ưu tiên dùng
        if (typeof meta?.next === 'number') {
            setPage(meta.next);
            return;
        }

        // Nếu có pageCount (tính từ meta.total) -> check giới hạn
        if (pageCount && page < pageCount) {
            setPage(page + 1);
            return;
        }

        // Nếu chưa có meta (lần load đầu tiên) -> cho +1 lạc quan
        if (!pageCount) {
            setPage(page + 1);
        }
    }, [meta?.next, page, pageCount, setPage]);

    return { page, limit, pageCount, setPage, setLimit, goPrev, goNext };
}