// stores/catalog.ts (client)
'use client';
import { create } from 'zustand';

type ArticlesState = {
  articles: any[];
  categories: any[];
  hydrate: (payload: { articles: any[]; categories: any[] }) => void;
};

export const useArticles = create<ArticlesState>((set) => ({
    articles: [],
  categories: [],
  hydrate: (p) => set(p),
}));
