'use client';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { swrFetcher, apiFetch, type AppError } from '@/lib/http';
import type { Articles, Article, PaginationMeta, } from '@/types';

/* ---------- (A) LIST + DELETE ---------- */
export function useArticlesPage(page = 1, limit = 10, filters: Record<string, any> = {}) {
    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const qs: Record<string, any> = { page, limit };
    for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && String(v).trim().length) qs[k] = String(v).trim();
    }

    // SWR key (relative path + params + token)
    const key = token ? ['/article', qs, token] : null;

    const { data, error, isLoading, mutate } = useSWR<any, AppError>(
        key,
        (key, ctx) => swrFetcher(key, token, ctx),
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

    // --- ONLY DELETE (chỉ cập nhật UI sau khi API OK) ---
    async function remove(id: number | string) {
        if (!token) throw new Error('Chưa đăng nhập');

        // 1) Gọi API xoá trước
        await apiFetch(`/article/delete/${id}`, { method: 'DELETE', token });
        // Nếu backend là /article/delete/:id thì sửa lại path cho đúng!

        // 2) API OK rồi mới cập nhật cache local (hoặc revalidate từ server)
        // Cách A: cập nhật cache tại chỗ (nhanh, không gọi lại server)
        await mutate((cur: any) => {
            if (!cur) return cur;
            const nextPosts = (cur.posts ?? []).filter((x: any) => String(x.id) !== String(id));
            const nextTotal = Math.max(0, (cur.meta?.total ?? 0) - 1);
            return { ...cur, posts: nextPosts, meta: { ...(cur.meta || {}), total: nextTotal } };
        }, false);

        // Cách B (tuỳ chọn): thay vì cập nhật tại chỗ, gọi lại server cho chắc dữ liệu
        // await mutate(); 
    }

    return { data: items, meta, error, isLoading, mutate, remove };
}

/* ---------- (B) DETAIL + CREATE/UPDATE ---------- */
export function useArticleEdit(id?: string | number) {
    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const key = id && token ? [`/article/${id}`, token] : null;

    const { data, error, isLoading, mutate } = useSWR<Article, AppError>(
        key,
        (key, ctx) => swrFetcher(key, token, ctx),
        { revalidateOnFocus: false }
    );

    return { article: data ?? null, error, isLoading, mutate };
}