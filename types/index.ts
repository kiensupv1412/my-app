export const STATUS = ['draft', 'del', 'yes'] as const;
export type Status = typeof STATUS[number];
export interface Article {
    id: number;
    category_id: number;
    status: Status;
    title: string | "";
    slug: string | "";
    description: string | "";
    description_html: string | "";
    content_html: string | "";
    content: string | "";
    thumb_id: number | null;
    thumb: MediaItem;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    description: string | "";
    slug: string;
    parent_id: number | "";
    priority: number;
    created_at: string;
    updated_at: string;
}

export type MediaItem = {
    id: number;
    site: number | null;
    is_background: boolean | null;
    folder_id: number | null;
    user_id: number | null;
    media_type: string | null;
    uuid: string;
    name: string;
    alt: string | null;
    caption: string | null;
    link: string | null;
    thumbnail: string | null;
    file_name: string;
    file_url: string;
    file_size: number | null;
    extension: string | null;
    mime: string;
    height: number | null;
    width: number | null;
    duration: number | null;
    orientation: string | null;
    version: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export interface PaginationMeta {
    limit: number | 'all';
    page: number;
    pages: number;
    total: number;
    next: number | null;
    prev: number | null;
}

export interface PaginationData {
    pages: number | null;
    total: number | null;
    limit: number;
    setLimit: (n: number) => void;
    page: number;
    setPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
}

export type Folder = {
    id: number;
    name: string;
    slug: string;
    site: number;
    created_at?: any;
    updated_at?: any;
    media_count?: number;
};

export type Folders = Folder[];
export type Articles = Article[];
export type Categories = Category[];

export type Mode = "create" | "edit";
export type ArticleCreatePayload = Omit<Article, 'id' | 'created_at' | 'updated_at'>;
export type ArticleUpdatePayload = Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>>;