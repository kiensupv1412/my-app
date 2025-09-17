// path: components/editor/providers/news-editor.tsx
'use client';
import * as React from 'react';

type Ctx = {
    categories: any[];
    mode: 'create' | 'edit';
    article?: any | null;
};
const NewsEditorCtx = React.createContext<Ctx | null>(null);

export function NewsEditorProvider({ children, ...value }: Ctx & { children: React.ReactNode }) {
    return <NewsEditorCtx.Provider value={value}>{children}</NewsEditorCtx.Provider>;
}

export function useNewsEditor() {
    const ctx = React.useContext(NewsEditorCtx);
    if (!ctx) throw new Error('useNewsEditor must be used within <NewsEditorProvider>');
    return ctx;
}
