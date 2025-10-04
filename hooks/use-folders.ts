'use client';
import { apiListFolders } from '@/lib/api';
import { Folders } from '@/types';
import useSWR, { SWRConfiguration } from 'swr'

export function useFolders(config?: SWRConfiguration) {
    const { data, error, isLoading, mutate } = useSWR(
        'folders',
        apiListFolders,
        { revalidateOnFocus: false, ...config }
    )
    return {
        folders: (data ?? []) as Folders[],
        foldersError: error,
        foldersLoading: isLoading,
        refetch: mutate,
    }
}