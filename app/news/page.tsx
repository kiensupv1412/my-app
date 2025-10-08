'use client';

import React from 'react';
import { useCategories, useArticlesPage } from '@/hooks/use-articles';
import { usePageLimit, usePagination } from '@/hooks/usePagination';
import {
  IconChevronDown,
  IconCircleCheckFilled, IconDotsVertical, IconEyeOff, IconLayoutColumns, IconPlus, IconTrash,

} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable
} from "@tanstack/react-table"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { MediaThumb } from '@/components/media/media-thumb';
import Pagination from '@/components/ui/pagination';
import { ArrowUpDown, ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react"
import SortButton from '@/components/ui/SortButton';
/*
 * path: app/news/page.tsx
 */
export default function Page() {
  const { categories } = useCategories();

  const [filters, setFilters] = React.useState<{ category_id?: number; title?: string }>({});
  const { page, setPage, limit, setLimit } = usePageLimit(1, 10);
  const { data: items = [], meta, isLoading } = useArticlesPage(page, limit, filters);
  const pagination = usePagination({ meta, limit, setLimit, page, setPage });

  const table = useReactTable({
    data: items,
    columns: getColumns(),
    meta: { categories, setFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    enableSortingRemoval: true,
  });

  return (
    <div className="@container/main flex flex-1 min-h-0 flex-col gap-2">
      <div className="flex flex-1 min-h-0 flex-col gap-4 py-4 md:gap-6 md:py-4">
        <Tabs defaultValue="all" className="flex w-full flex-1 min-h-0 flex-col gap-4">
          <div className="flex items-center justify-between px-4 lg:px-6">
            <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
              <TabsTrigger value="all">All <span className="secondary"> {/**/}</span></TabsTrigger>
              <TabsTrigger value="favorite">Favorite <Badge variant="secondary">3</Badge></TabsTrigger>
              <TabsTrigger value="top-view">Top Views <Badge variant="secondary">2</Badge></TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search title..."
                value={filters.title ?? ""}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, title: e.target.value }));
                  setPage(1);
                }}
                className="h-8 w-[200px] lg:w-[250px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconLayoutColumns />
                    <span className="hidden lg:inline">Danh Mục</span>
                    <IconChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilters(f => ({ ...f, category_id: undefined }));
                      setPage(1);
                    }}
                    className="font-medium"
                  >
                    Tất cả
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map((cat) => {
                    const isActive = filters.category_id === cat.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={cat.id}
                        checked={!!isActive}
                        onCheckedChange={(checked) => {
                          setFilters((f) => ({ ...f, category_id: checked ? cat.id : undefined }));
                          setPage(1);
                        }}
                        className="capitalize"
                      >
                        {cat.name}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" asChild>
                <Link href="/news/edit">
                  <IconPlus />
                  <span className="hidden lg:inline">Create News</span>
                </Link>
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="flex flex-1 min-h-0 flex-col gap-4 px-4 lg:px-6">
            <div className="flex min-h-0 flex-1 flex-col rounded-sm border">
              <div className="min-h-0 flex-1">
                {/* SCROLLER DỌC DUY NHẤT */}
                <div className="h-full overflow-auto overscroll-y-contain [scrollbar-gutter:stable]">
                  <Table className="w-full text-sm" style={{ borderCollapse: 'collapse' }} >
                    {/* ĐẶT sticky Ở ĐÂY */}
                    <TableHeader className="sticky top-0 z-20 bg-[#ddd]">
                      {table.getHeaderGroups().map((hg) => (
                        <TableRow className="h-12" key={hg.id}>
                          {hg.headers.map((h) => (
                            <TableHead key={h.id} colSpan={h.colSpan}>
                              {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>

                    <TableBody className="**:data-[slot=table-cell]:first:w-8">
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="h-18">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                            {isLoading ? "Đang tải..." : "No results."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* FOOTER KHÔNG CUỘN */}
              <div className="mt-0 flex items-center justify-between border-t bg-background px-4 py-2">
                <div className="flex w-full items-center gap-8 lg:w-fit">
                  <Pagination
                    {...pagination}
                    onChangeLimit={(n) => {
                      setLimit(n);
                      setPage(1);
                    }}
                    perPageOptions={[10, 30, 50, 100]}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* tabs khác giữ nguyên nếu cần */}
          <TabsContent value="favorite" className="flex flex-col px-4 lg:px-6">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
          </TabsContent>
          <TabsContent value="top-view" className="flex flex-col px-4 lg:px-6">
            <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  );
}

function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit", ...opts }).format(date)
}

const tableSchema = z.object({
  id: z.number(),
  title: z.string(),
  category_id: z.number().optional(),
  status: z.string(),
  thumb: z.object({ file_url: z.string().optional() }).optional(),
  updated_at: z.string(),
});

function getColumns(): ColumnDef<z.infer<typeof tableSchema>>[] {
  return [
    {
      accessorKey: "id",
      header: ({ column }) => <SortButton column={column}>id</SortButton>,
      cell: ({ row }) => <span className="text-sm text-primary">{row.original.id}</span>, meta: { className: "text-center" }
    },
    {
      header: "Thumbnail",
      cell: ({ row }) => (
        <div className="relative h-14 w-[100px]">
          <MediaThumb src={row.original?.thumb?.file_url} alt={row.original.title ?? "thumbnail"}
            className="h-full w-full rounded-sm object-cover dark:brightness-[0.2] dark:grayscale" />
        </div>),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={`/news/edit?id=${row.original.id}`}
          className="line-clamp-1"
        >
          {row.original.title}
        </Link>
      ),
      size: 300,       // px
      minSize: 300,    // px
      enableResizing: false,
      enableHiding: false,
    },
    {
      accessorKey: "category_id",
      header: "Category",
      filterFn: (row, id, value) => {
        return row.getValue(id) === value
      },
      cell: ({ row, table }) => {
        const categories = table.options.meta?.categories ?? [];
        const cat = categories.find(c => c.id === row.original.category_id);
        return <Badge variant="secondary" className="text-muted-foreground px-1.5 rounded-sm">{cat?.name ?? "—"}</Badge>
      }
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortButton column={column}>Status</SortButton>,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-muted-foreground px-1.5">
          {row.original.status === "yes" ? <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            : row.original.status === "draft" ? <IconEyeOff /> : <IconTrash />}
        </Badge>
      ),
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => <SortButton column={column}>Publishing date</SortButton>,
      cell: ({ row }) => <span className="text-sm text-primary">{formatDate(row.original.updated_at)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row, table }) => (
        <ActionsCell
          id={row.original.id}
        />
      )
    }
  ]
}

function ActionsCell({ id }: { id: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 data-[state=open]:bg-muted">
          <IconDotsVertical /><span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem asChild>
          <Link href={`/news/edit?id=${id}`}>Edit</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive"  >Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}