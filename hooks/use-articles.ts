'use client';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { swrFetcher, type AppError, http } from '@/lib/http';
import type { Articles, Article, PaginationMeta, } from '@/types';

/* ---------- (A) LIST + DELETE ---------- */
export function useArticlesPage(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {}
) {
    // build query string params (lọc rỗng)
    const qs: Record<string, any> = { page, limit };
    for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && String(v).trim().length) {
            qs[k] = String(v).trim();
        }
    }

    const key = ['/article', qs] as const;

    const { data, error, isLoading, mutate } = useSWR<any, AppError>(
        key,
        (key, ctx) => swrFetcher(key, ctx),
        { keepPreviousData: true, dedupingInterval: 300 }
    );

    const items: Articles = Array.isArray(data?.posts) ? data.posts : [];
    const rawLimit = data?.meta?.limit ?? limit;
    const parsedLimit = rawLimit === 'all' ? limit : Number(rawLimit) || limit;

    const meta: PaginationMeta = {
        page: Number(data?.meta?.page ?? page),
        pages: Math.max(1, Number(data?.meta?.pages ?? 1) || 1),
        limit: parsedLimit,
        total: typeof data?.meta?.total === 'number' ? data.meta.total : null,
        prev: data?.meta?.prev ?? null,
        next: data?.meta?.next ?? null,
    };

    async function remove(id: number | string) {
        // 1) gọi API xoá
        await http.delete(`/article/delete/${id}`);

        // 2) cập nhật cache local (không revalidate)
        await mutate((cur: any) => {
            if (!cur) return cur;
            const nextPosts = (cur.posts ?? []).filter((x: any) => String(x.id) !== String(id));
            const nextTotal = Math.max(0, (cur.meta?.total ?? 0) - 1);
            return { ...cur, posts: nextPosts, meta: { ...(cur.meta || {}), total: nextTotal } };
        }, false);

        // Hoặc: await mutate(); // nếu muốn gọi lại server
    }

    return { data: items, meta, error, isLoading, mutate, remove };
}

/* ---------- (B) DETAIL ---------- */
export function useArticleEdit(id?: string | number) {
    const key = id ? `/article/${id}` : null;

    const { data, error, isLoading, mutate } = useSWR<Article, AppError>(
        key,
        (key, ctx) => swrFetcher(key, ctx),
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    return { article: data ?? null, error, isLoading, mutate };
}
