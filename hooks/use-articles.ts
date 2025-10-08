/*
 * path: hooks/useArticles.ts
 */
'use client';

import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/http';
import { Article, Articles, Categories, PaginationMeta } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export function useArticleEdit(id?: string | number) {
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
    return { categories: data as Categories ?? [], error, isLoading };
}

export function useArticlesPage(page = 1, limit = 10, filters: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(limit));

    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length) qs.set(k, String(v));
    });

    const key = `${BASE_URL}/article?${qs.toString()}`;
    const { data, error, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
        keepPreviousData: true,
        dedupingInterval: 300,
    });

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

    return { data: items, meta, error, isLoading };
}

export async function createArticle(newItem: any) {
    const key = BASE_URL + '/article';

    await mutate(
        key,
        async (current: { data: any[]; meta?: any } | undefined) => {
            const rows = current?.data ?? [];
            const meta = current?.meta;

            const res = await fetch(key, {
                method: 'POST',
                body: JSON.stringify(newItem),
                headers: { 'Content-Type': 'application/json' },
            });
            const created = await res.json();
            return { data: [created, ...rows], meta };
        },
        { revalidate: false }
    );
}

export async function updateArticle(id: string | number, patch: any) {
    const listKey = BASE_URL + '/article';
    const apiUpdateUrl = BASE_URL + `/article/update/${id}`;

    const res = await fetch(apiUpdateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });

    const serverData = await res.json();

    // Cập nhật cache local cho đồng bộ
    mutate(listKey, (current: any) => {
        if (!current) return current;

        if (Array.isArray(current)) {
            return current.map((x) => (String(x.id) === String(id) ? serverData : x));
        }

        if (Array.isArray(current.rows)) {
            return {
                ...current,
                rows: current.rows.map((x: any) =>
                    String(x.id) === String(id) ? serverData : x
                ),
            };
        }

        return current;
    }, false);

    return serverData;
}

export async function checkSlugExists(slug: string, excludeId: number | undefined) {
    const res = await fetch(`${BASE_URL}/article/slug/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, exclude_id: excludeId ?? null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Slug check failed");
    return data as {
        available: boolean;
        slug: string;
        conflict_id: number | null;
    };
}
