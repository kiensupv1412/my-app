// lib/keys.ts
export const k = {
    media: (page: number, limit: number, folderId: number | 'all', token: string) =>
        ['/media', { page, limit, folder_id: folderId }, token] as const,

    articles: (qs: Record<string, any>, token: string) =>
        ['/article', qs, token] as const,

    folders: (token: string) =>
        ['/folders', token] as const,

    categories: (token: string) =>
        ['/article/categories', token] as const,
};