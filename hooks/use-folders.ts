'use client';
import useSWR from 'swr';
import type { SWRConfiguration } from 'swr';
import { apiListFolders } from '@/lib/api';
import type { Folder, Folders } from '@/types';
import type { AppError } from '@/lib/http';

const KEY = 'folders' as const;

export function useFolders(config?: SWRConfiguration<Folders, AppError>) {
    const { data, error, isLoading, isValidating, mutate } = useSWR<Folders, AppError, typeof KEY>(
        KEY,
        () => apiListFolders(),
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
