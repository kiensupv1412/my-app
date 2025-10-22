'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import { swrFetcher, type AppError } from '@/lib/http';
import type { Folders } from '@/types';
import { k } from '@/lib/keys';

export function useFolders(config?: SWRConfiguration<Folders, AppError>) {
    const key = k.folders();
    const { data, error, isLoading, isValidating, mutate } = useSWR<Folders, AppError>(
        key,
        (key, ctx) => swrFetcher(key, ctx),
        { revalidateOnFocus: false, keepPreviousData: true, ...config }
    );

    return {
        folders: data ?? [],
        foldersError: error,
        canRetry: !!error?.retryable,
        foldersLoading: isLoading,
        isValidating,
        refetch: mutate,
    };
}
