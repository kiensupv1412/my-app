/*
 * path: app/dashboard/page.tsx
 */

'use client';

import { DataArticles } from "@/components/dashboard/data-articles";
import { useArticles, useCategories, createArticleOptimistic, updateArticleOptimistic } from '@/hooks/useArticles';


export default function Page() {
  const { articles } = useArticles();
  const { categories } = useCategories();

  return (
    <div className="@container/main flex flex-1 min-h-0 flex-col gap-2">
      <div className="flex flex-1 min-h-0 flex-col gap-4 py-4 md:gap-6 md:py-4">
        <DataArticles data={articles} categories={categories} />
      </div>
    </div>
  )
}
