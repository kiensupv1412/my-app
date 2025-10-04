/*
 * path: components/dashboard/data-articles.tsx
 */
"use client"

import {
  IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight,
  IconCircleCheckFilled, IconDotsVertical, IconEyeOff, IconLayoutColumns, IconPlus, IconTrash,

} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues, useReactTable
} from "@tanstack/react-table"
import * as React from "react"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { MediaThumb } from '../media/media-thumb'
import { useAppToast } from '@/components/providers/app-toast'
import { PaginationData } from "@/types"
import Pagination from "../ui/pagination"

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
    { header: "id", cell: ({ row }) => <span className="text-sm text-primary">{row.original.id}</span>, meta: { className: "text-center" } },
    {
      header: "Thumbnail",
      cell: ({ row }) =>
        <div className="relative h-14 w-[100px]">
          <MediaThumb src={row.original?.thumb?.file_url} alt={row.original.title ?? "thumbnail"}
            className="h-full w-full rounded-sm object-cover dark:brightness-[0.2] dark:grayscale" />
        </div>
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row, table }) => {
        return <Link href={`/news/edit?id=${row.original.id}`}>{row.original.title}</Link>
      },
      enableHiding: false,
      meta: { className: "whitespace-normal" }
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
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-muted-foreground px-1.5">
          {row.original.status === "yes" ? <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            : row.original.status === "draft" ? <IconEyeOff /> : <IconTrash />}
        </Badge>
      ),
    },
    {
      header: "Publishing date",
      cell: ({ row }) => <span className="text-sm text-primary">{formatDate(row.original.updated_at)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row, table }) => {
        const router = useRouter();
        const { error } = useAppToast();
        const articleId = row.original.id;
        async function handleDelete() {
          const ok = await confirmDelete();
          if (ok) {
            try {
              await table.options.meta?.onDelete?.(articleId);
            } catch (e) {
              error('Delete failed:');
            }
          }
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
                <IconDotsVertical /><span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => router.push(`/news/edit?id=${articleId}`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem>Favorite</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }
  ]
}

type Props = {
  articles: any[];
  categories: any[];
  isLoading?: boolean;
  pagination: PaginationData
}

export function DataArticles({
  articles,
  categories,
  isLoading,
  pagination
}: Props) {

  const table = useReactTable({
    data: articles,
    columns: getColumns(),
    meta: { categories },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
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
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => {
              table.getColumn("title")?.setFilterValue(e.target.value);
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
                onClick={() => table.getColumn('category_id')?.setFilterValue(undefined)}
                className="font-medium"
              >
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((cat) => {
                const isActive = table.getColumn('category_id')?.getFilterValue() === cat.id
                return (
                  <DropdownMenuCheckboxItem
                    key={cat.id}
                    checked={!!isActive}
                    onCheckedChange={(checked) => {
                      if (checked) table.getColumn('category_id')?.setFilterValue(cat.id)
                      else table.getColumn('category_id')?.setFilterValue(undefined)
                    }}
                    className="capitalize"
                  >
                    {cat.name}
                  </DropdownMenuCheckboxItem>
                )
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
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="overflow-hidden rounded-sm border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow className='h-12' key={hg.id}>
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
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                      {isLoading ? 'Đang tải...' : 'No results.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* FOOTER: phân trang server điều khiển bởi props */}
        <div className="mt-auto flex items-center justify-between border-t bg-background px-4 py-2">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {/* selection counter */}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <Pagination {...pagination} />
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
  )
}

