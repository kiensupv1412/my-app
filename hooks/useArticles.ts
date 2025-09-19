/*
 * path: hooks/useArticles.ts
 */
'use client';

import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Article } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

/** Lấy tất cả (giữ lại nếu còn dùng nơi khác) */
export function useArticles() {
    const { data, error, isLoading } = useSWR(BASE_URL + '/article', fetcher, { revalidateOnFocus: false });
    return { articles: data ?? [], error, isLoading };
}

export function useArticle(id?: string | number) {
    const shouldFetch = !!id;
    const { data }: { data: Article | null } = useSWR(
        shouldFetch ? `${BASE_URL}/article/${id}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    return { article: data };
}

export function useCategories() {
    const { data, error, isLoading } = useSWR(BASE_URL + '/article/categories', fetcher, { revalidateOnFocus: false });
    return { categories: data ?? [], error, isLoading };
}

/** ✅ Lấy MỘT TRANG theo page/limit (không dùng swr/infinite) */
export function useArticlesPage(page = 1, limit = 10) {
    const key = `${BASE_URL.replace(/\/$/, '')}/article?page=${page}&limit=${limit}`;
    const { data, error, isLoading } = useSWR(key, fetcher, { revalidateOnFocus: false });

    let items: any[] = [];
    let meta: { page: number; limit: number; total?: number; hasNext?: boolean } = { page, limit };

    if (Array.isArray(data)) {
        items = data;
        meta = { page, limit, hasNext: items.length === limit };
    } else if (data && typeof data === 'object') {
        items = Array.isArray(data.data) ? data.data : [];
        meta = {
            page: data?.meta?.page ?? page,
            limit: data?.meta?.limit ?? limit,
            total: data?.meta?.total,
            hasNext: data?.meta?.hasNext,
        };
    }

    return { data: items, meta, error, isLoading };
}

/* ===== Helpers giữ nguyên ===== */

export async function createArticleOptimistic(newItem: any) {
    const key = BASE_URL + '/article';

    await mutate(
        key,
        async (current: { data: any[]; meta?: any } | undefined) => {
            const rows = current?.data ?? [];
            const meta = current?.meta;

            const tmpId = `tmp_${Date.now()}`;
            const optimisticItem = { ...newItem, id: tmpId, _optimistic: true };

            const res = await fetch(key, {
                method: 'POST',
                body: JSON.stringify(newItem),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('POST failed');
            const created = await res.json();

            return { data: [created, ...rows], meta };
        },
        { revalidate: false }
    );
}

export async function updateArticleOptimistic(id: string | number, patch: any) {
    const listKey = BASE_URL + '/article';
    const apiUpdateUrl = BASE_URL + `/article/update/${id}`;

    await mutate(
        listKey,
        async (current: any) => {
            // Chuẩn hoá các shape: array | {rows} | {data} | {items}
            const isArray = Array.isArray(current);
            const rows: any[] = isArray
                ? (current ?? [])
                : (current?.rows ?? current?.data ?? current?.items ?? []);

            // Nếu cache chưa có list → bỏ qua update list, chỉ gọi API & revalidate sau
            if (!rows || rows.length === 0) {
                // vẫn gọi API thật để update server
                try {
                    const res = await fetch(apiUpdateUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(patch),
                    });
                    if (!res.ok) throw new Error('PUT failed');
                } catch { /* noop: giữ nguyên current */ }
                // Không thay đổi cache khi chưa có list
                return current;
            }

            const idx = rows.findIndex((x) => String(x?.id) === String(id));
            if (idx === -1) {
                // Không có trong list hiện tại → trả nguyên current
                // (VD đang ở trang khác, hoặc filter khác)
                try {
                    const res = await fetch(apiUpdateUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(patch),
                    });
                    if (!res.ok) throw new Error('PUT failed');
                } catch { }
                return current;
            }

            // Optimistic local
            const updatedLocal = { ...rows[idx], ...patch };
            let optimisticState: any;
            if (isArray) {
                const next = [...rows];
                next[idx] = updatedLocal;
                optimisticState = next;
            } else {
                const next = [...rows];
                next[idx] = updatedLocal;
                // giữ nguyên meta/total nếu có
                optimisticState = {
                    ...current,
                    rows: current?.rows ? next : undefined,
                    data: current?.data ? next : undefined,
                    items: current?.items ? next : undefined,
                };
            }

            // Gọi API thật, merge trả về
            const res = await fetch(apiUpdateUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error('PUT failed');
            const serverData = await res.json();

            if (isArray) {
                const next = [...(optimisticState as any[])];
                next[idx] = serverData;
                return next;
            } else {
                const cur = optimisticState as any;
                const base = cur.rows ?? cur.data ?? cur.items ?? [];
                const next = [...base];
                next[idx] = serverData;
                return {
                    ...cur,
                    rows: cur.rows ? next : undefined,
                    data: cur.data ? next : undefined,
                    items: cur.items ? next : undefined,
                };
            }
        },
        { revalidate: false }
    );

    mutate(listKey);
}