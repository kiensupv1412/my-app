'use client';
import { useArticles } from '@/stores/articles';
import { useEffect } from 'react';

export function ArticlesProvider({ initial, children }:{
  initial: { articles: any[]; categories: any[] };
  children: React.ReactNode;
}) {
  const hydrate = useArticles((s) => s.hydrate);
  useEffect(() => { hydrate(initial); }, [hydrate, initial]);
  return children as any;
}
