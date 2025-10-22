// hooks/use-taxonomies.ts
'use client';

import useSWR from 'swr';
import { swrFetcher } from '@/lib/http';
import type { Categories, Tags } from '@/types';

/* --------------------------- CATEGORIES --------------------------- */
export function useCategories() {
    const { data, error, isLoading, mutate } = useSWR<Categories>(
        '/article/categories',
        (key, ctx) => swrFetcher(key, ctx),
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    return { categories: data ?? [], error, isLoading, mutate };
}

/* ------------------------------ TAGS ------------------------------ */
export function useTags() {
    const { data, error, isLoading, mutate } = useSWR<Tags>(
        '/article/tags',
        (key, ctx) => swrFetcher(key, ctx),
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    return { tags: data ?? [], error, isLoading, mutate };
}
