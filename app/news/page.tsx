'use client';

import React from 'react';
import { DataArticles } from '@/components/news/table-articles';
import { useCategories, useArticlesPage } from '@/hooks/use-articles';
import { useUrlPagination } from '@/hooks/use-url-pagination';

export default function Page() {
  const { categories } = useCategories();

  // 🔹 pagination state lấy từ URL (single source of truth)
  const pag = useUrlPagination();

  // 🔹 fetch data theo page/limit hiện tại
  const { data: items = [], meta, isLoading } = useArticlesPage(pag.page, pag.limit);

  return (
    <div className="@container/main flex flex-1 min-h-0 flex-col gap-2">
      <div className="flex flex-1 min-h-0 flex-col gap-4 py-4 md:gap-6 md:py-4">
        <DataArticles
          articles={items}
          categories={categories}
          serverPage={pag.page}
          pageCount={pag.pageCount}
          pageSize={pag.limit}
          isLoading={isLoading}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setLimit}
        />
      </div>
    </div>
  );
}