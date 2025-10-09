'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import { useSession } from 'next-auth/react';
import { swrFetcher, type AppError } from '@/lib/http';
import type { Folders } from '@/types';
import { k } from '@/lib/keys';

export function useFolders(config?: SWRConfiguration<Folders, AppError>) {
    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const key = token ? k.folders(token) : null;

    const { data, error, isLoading, isValidating, mutate } = useSWR<Folders, AppError>(
        key,
        (key, ctx) => swrFetcher(key, token, ctx),
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