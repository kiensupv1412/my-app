'use client';

import { Article, Category } from '@/types/news';
import * as React from 'react';

type NewsRoot = {
    articles: Article[];
    categories: Category[];
};

const Ctx = React.createContext<NewsRoot | null>(null);

export function NewsProvider({ value, children }: { value: NewsRoot; children: React.ReactNode }) {
    return <Ctx.Provider value={value}> {children} </Ctx.Provider>;
}

export function useNews() {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error('useNewsRoot must be used within <NewsRootProvider>');
    return ctx;
}
