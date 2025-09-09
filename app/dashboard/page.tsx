'use client';

import { DataTable } from "@/components/data-table";
import { useRootData } from '@/components/providers/root-data';


export default function Page() {
  const { articles, categories } = useRootData();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <DataTable data={articles} categories={categories} />
      </div>
    </div>
  )
}
