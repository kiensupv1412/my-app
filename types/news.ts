export interface Article {
    id: number;
    category_id: number;
    status: string | null;
    title: string | null;
    slug: string | null;
    description: string | null;
    body: string | null;
    content: string | null;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    description: string | null;
    slug: string;
    parent_id: number | null;
    priority: number;
    created_at: string;
    updated_at: string;
}