/*
 * path: components/dashboard/data-articles.tsx
 */

"use client"

import { useAppToast } from '@/components/providers/app-toast'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconEyeOff,
  IconLayoutColumns,
  IconPlus,
  IconTrash,
  IconTrendingUp
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import * as React from "react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { TableCellViewer } from './TableCellViewer'
import { MediaThumb } from '../media/media-thumb'
import { AspectRatio } from '../ui/aspect-ratio'
import { useEditor } from '../editor/editor-kit'


function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    ...opts,
  }).format(date)
}

export const schema = z.object({
  id: z.number(),
  title: z.string(),
  category_name: z.string(),
  status: z.string(),
  thumb: z.string(),
  updated_at: z.string(),
})

export const schemaCategory = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })
);

function getColumns(categories: z.infer<typeof schemaCategory>[]): ColumnDef<z.infer<typeof schema>>[] {
  return [
    {
      header: "id",
      cell: ({ row }) =>
        <span className="text-sm text-primary">{row.original.id}</span>,
      meta: { className: "text-center" }
    },
    {
      header: "Thumbnail",
      cell: ({ row }) =>
        <div className="relative h-14 w-[100px]">
          <MediaThumb
            src={row.original.thumb}
            alt={row.original.title ?? "thumbnail"}
            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>,
      meta: { className: "" }
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        return <TableCellViewer mode={"dashboard"} item={row.original} categories={categories} />
      },
      enableHiding: false,
      meta: { className: "whitespace-normal" }

    },
    {
      accessorKey: "category_id",
      header: "Category",
      cell: ({ row }) => {
        const cat = categories.find(c => c.id === row.original.category_id);
        return (
          <Badge variant="secondary" className="text-muted-foreground px-1.5">
            {cat?.name ?? "—"}
          </Badge>
        )
      }
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-muted-foreground px-1.5">
          {row.original.status === "yes" ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : row.original.status === "draft" ? (
            <IconEyeOff />
          ) : <IconTrash />}
          {/* {row.original.status} */}
        </Badge>
      ),
    },
    {
      header: "Publishing date",
      cell: ({ row }) =>
        <span className="text-sm text-primary">{formatDate(row.original.updated_at)}</span>,
      meta: { className: "" }
    },
    {
      id: 'actions',
      cell: ({ row, table }) => {
        const router = useRouter();
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
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                  size="icon"
                >
                  <IconDotsVertical />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => router.push(`/news/edit/${articleId}`)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>Favorite</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </>
        );
      },
    }
  ]
}


export function DataArticles({
  data: initialData,
  categories: initialCategories
}: {
  data: z.infer<typeof schema>[]
  categories: z.infer<typeof schemaCategory>[]
}) {

  const [data, setData] = React.useState(() => initialData)
  const [categories, setCategories] = React.useState(() => initialCategories)

  React.useEffect(() => {
    setData(initialData)
    setCategories(initialCategories)
  }, [initialData, initialCategories])

  const { success, error } = useAppToast();

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const onDelete = React.useCallback((id: number) => {
    setData(prev => {
      const next = prev.filter(x => x.id !== id)

      // Cập nhật pageIndex an toàn theo kích thước mới
      setPagination(p => {
        const total = next.length
        const pageCount = Math.max(1, Math.ceil(total / p.pageSize))
        // nếu trang hiện tại vượt quá page cuối -> kéo về trang cuối
        const newIndex = Math.min(p.pageIndex, pageCount - 1)
        return { ...p, pageIndex: newIndex }
      })

      return next
    })
    success('Đã xoá bài viết');

  }, [])

  const table = useReactTable({
    data,
    columns: React.useMemo(() => getColumns(categories), [categories]),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    autoResetPageIndex: false,   // 👈 quan trọng

    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: { onDelete },
  })

  return (
    <Tabs
      defaultValue="all"
      className="flex w-full flex-1 min-h-0 flex-col gap-4"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">
            All <span className="secondary">{data.length}</span>
          </TabsTrigger>
          <TabsTrigger value="favorite">
            Favorite <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="top-view">
            Top Views <Badge variant="secondary">2</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => {
              table.getColumn("title")?.setFilterValue(e.target.value);
              table.setPageIndex(0);
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
                const isActive = table.getColumn('category_id')?.getFilterValue() === cat.name
                return (
                  <DropdownMenuCheckboxItem
                    key={cat.id}
                    checked={!!isActive}
                    // chọn 1 category sẽ set filter về đúng tên category
                    onCheckedChange={(checked) => {
                      if (checked) {
                        table.getColumn('category_id')?.setFilterValue(cat.name)
                      } else {
                        table.getColumn('category_id')?.setFilterValue(undefined)
                      }
                    }}
                    className="capitalize"
                  >
                    {cat.name}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <Link href="/news/create" >
              <span className="hidden lg:inline">Create News</span>
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value="all"
        className="flex flex-1 min-h-0 flex-col gap-4 px-4 lg:px-6"
      >
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="overflow-hidden rounded-sm border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow className='h-12' key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}
                          className={cell.column.columnDef.meta?.className}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between border-t bg-background px-4 py-2">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="favorite"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="top-view"
        className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}




