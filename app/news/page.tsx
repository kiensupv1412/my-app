/*
 * path: app/news/page.tsx
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataArticles } from '@/components/news/table-articles';
import { useCategories, useArticlesPage } from '@/hooks/useArticles';

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPage = Math.max(1, parseInt(searchParams?.get('page') ?? '1', 10) || 1);

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(10);                 // 👈 NEW: server limit

  const { data: pageData = [], meta, isLoading } = useArticlesPage(page, limit);
  const { categories } = useCategories();

  // sync nếu user sửa ?page=... trong URL
  useEffect(() => {
    const p = Math.max(1, parseInt(searchParams?.get('page') ?? '1', 10) || 1);
    if (p !== page) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const total = typeof meta?.total === 'number' ? meta.total : undefined;
  const pageCount = total ? Math.max(1, Math.ceil(total / limit)) : undefined;

  const handlePageChange = (next: number) => {
    if (next < 1) return;
    if (pageCount && next > pageCount) return;
    setPage(next);
    const qs = new URLSearchParams(window.location.search);
    qs.set('page', String(next));
    router.replace(`?${qs.toString()}`);
  };

  const handlePageSizeChange = (nextSize: number) => {
    if (!Number.isFinite(nextSize) || nextSize <= 0) return;
    setLimit(nextSize);          // 👈 đổi limit => lần fetch sau nhận đúng số post
    setPage(1);                  // về trang 1 cho chắc
    const qs = new URLSearchParams(window.location.search);
    qs.set('page', '1');
    router.replace(`?${qs.toString()}`);
  };

  return (
    <div className="@container/main flex flex-1 min-h-0 flex-col gap-2">
      <div className="flex flex-1 min-h-0 flex-col gap-4 py-4 md:gap-6 md:py-4">
        <DataArticles
          articles={pageData}
          categories={categories}
          serverPage={page}
          pageCount={pageCount}
          totalItems={total}
          pageSize={limit}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}