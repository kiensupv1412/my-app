'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { useRootData } from '@/components/providers/root-data';
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";


export default function Page() {
  const { articles, categories } = useRootData();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable data={articles} categories={categories} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
