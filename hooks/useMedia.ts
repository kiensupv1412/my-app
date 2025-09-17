import useSWR from 'swr'
import { apiListFolders, apiListMedia } from '@/lib/media.api'

export function useFolders() {
    const { data, error, isLoading, mutate } = useSWR(
        '/folders',
        apiListFolders,
        { revalidateOnFocus: false }
    )
    return { folders: data ?? [], error, isLoading, refetch: mutate }
}

export function useMediaList(params: { page: number; pageSize: number; folder_id?: number | null }) {
    const key = `/media?page=${params.page}&pageSize=${params.pageSize}` +
        (params.folder_id !== null && params.folder_id !== undefined ? `&folder_id=${params.folder_id}` : '')

    const { data, error, isLoading, mutate } = useSWR(
        key,
        () => apiListMedia(params),
        { revalidateOnFocus: false, keepPreviousData: true as any }
    )

    return {
        media: data?.rows ?? [],
        total: data?.total ?? 0,
        error, isLoading, refetch: mutate
    }
}


