// components/providers/news-editor-provider.tsx
'use client'
import * as React from 'react';

export type EditorArticle = {
    id?: number | string | null;
    title?: string;
    slug?: string;
    status?: string;
    category_id?: number | null;
    thumb?: object | null;
    thumb_id?: number | null;
    description?: string;
    body?: string;
    content?: any;
};

type Ctx = {
    mode: 'create' | 'edit';
    categories: any[];
    article: EditorArticle | null;
    setArticle: React.Dispatch<React.SetStateAction<EditorArticle | null>>;
};

const NewsEditorCtx = React.createContext<Ctx | null>(null);

export function NewsEditorProvider(
    { children, ...value }: Omit<Ctx, 'setArticle'> & { children: React.ReactNode }
) {
    // Nếu muốn provider tự tạo state, bạn có thể bỏ qua và truyền từ trên xuống cũng được
    const [article, setArticle] = React.useState<EditorArticle | null>(value.article ?? null);

    // đồng bộ khi prop article đổi (khi SWR trả về dữ liệu)
    React.useEffect(() => {
        setArticle(value.article ?? null);
    }, [value.article]);

    const ctx: Ctx = { ...value, article, setArticle };
    return <NewsEditorCtx.Provider value={ctx}>{children}</NewsEditorCtx.Provider>;
}

export function useNewsEditor() {
    const ctx = React.useContext(NewsEditorCtx);
    if (!ctx) throw new Error('useNewsEditor must be used within <NewsEditorProvider>');
    return ctx;
}