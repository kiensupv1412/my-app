/*
 * path: hooks/useArticles.ts
 */
'use client';

import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

/** Lấy tất cả (giữ lại nếu còn dùng nơi khác) */
export function useArticles() {
    const { data, error, isLoading } = useSWR(BASE_URL + '/article', fetcher, { revalidateOnFocus: false });
    return { articles: data ?? [], error, isLoading };
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

    await mutate(key, async (current: any[] = []) => {
        const tmpId = `tmp_${Date.now()}`;
        const optimistic = [{ ...newItem, id: tmpId, _optimistic: true }, ...current];

        try {
            const res = await fetch(key, {
                method: 'POST',
                body: JSON.stringify(newItem),
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('POST failed');
            const created = await res.json();
            return [created, ...current];
        } catch {
            return current;
        }
    }, { revalidate: false });
}

export async function updateArticleOptimistic(id: string, patch: any) {
    const listKey = BASE_URL + '/article';
    const detailKey = BASE_URL + `/article/update/${id}`;

    await mutate(listKey, async (current: any[] = []) => {
        const prev = current;
        const idx = prev.findIndex(x => String(x.id) === String(id));
        if (idx === -1) return prev;

        const optimistic = [...prev];
        optimistic[idx] = { ...prev[idx], ...patch };

        try {
            const res = await fetch(detailKey, {
                method: 'PUT',
                body: JSON.stringify(patch),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('PUT failed');

            const serverData = await res.json();
            const merged = [...prev];
            merged[idx] = serverData;
            mutate(detailKey, serverData, false);
            return merged;
        } catch {
            return prev;
        }
    }, { revalidate: false });
}