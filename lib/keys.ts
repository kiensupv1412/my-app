// lib/keys.ts
export const k = {
    media: (page: number, limit: number, folderId: number | 'all') =>
        ['/media', { page, limit, folder_id: folderId }] as const,

    articles: (qs: Record<string, any>) =>
        ['/article', qs] as const,

    folders: () =>
        ['/folders'] as const,

    categories: () =>
        ['/article/categories'] as const,
};
