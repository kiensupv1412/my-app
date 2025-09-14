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
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
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
import { ConfirmDeleteModal } from "../modals/confirm-delete"

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
  reviewer: z.string(),
})

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
        <img src={row.original.thumb}
          alt={row.original.title ?? "thumbnail"}
          className="h-auto max-h-16 w-24 object-cover rounded-md border"
        />,
      // <IconLoader/>
      meta: { className: "align-middle" }
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} categories={categories} />
      },
      enableHiding: false,
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => (
        <div className="w-32">
          <Badge variant="secondary" className="text-muted-foreground px-1.5">
            {row.original.category_name}
          </Badge>
        </div>
      ),
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


    // {
    //   header: "Reviewer",
    //   cell: ({ row }) => {
    //     const isAssigned = row.original.reviewer !== "Assign reviewer"

    //     // if (isAssigned) {
    //     //   return row.original.reviewer
    //     // }

    //     return (
    //       <>
    //         <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
    //           Reviewer
    //         </Label>
    //         <Select>
    //           <SelectTrigger
    //             className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
    //             size="sm"
    //             id={`${row.original.id}-reviewer`}
    //           >
    //             <SelectValue placeholder="Assign reviewer" />
    //           </SelectTrigger>
    //           <SelectContent align="end">
    //             <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
    //             <SelectItem value="Jamik Tashpulatov">
    //               Jamik Tashpulatov
    //             </SelectItem>
    //           </SelectContent>
    //         </Select>
    //       </>
    //     )
    //   },
    // },
    {
      id: 'actions',
      cell: ({ row, table }) => {
        const router = useRouter();
        const articleId = row.original.id;

        const [open, setOpen] = React.useState(false);
        const [loading, setLoading] = React.useState(false);

        async function handleConfirm() {
          try {
            setLoading(true);
            await table.options.meta?.onDelete?.(articleId);
            setOpen(false);
          } finally {
            setLoading(false);
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
                <DropdownMenuItem>Make a copy</DropdownMenuItem>
                <DropdownMenuItem>Favorite</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ConfirmDeleteModal
              open={open}
              onOpenChange={setOpen}
              onConfirm={handleConfirm}
              loading={loading}
              title="Xoá bài viết?"
              description={`Bạn chắc chắn muốn xoá bài #${articleId}? Hành động này không thể hoàn tác.`}
              confirmText="Xoá"
              cancelText="Huỷ"
            />
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
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 14,
  })
  const { success, error } = useAppToast();

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
      className="w-full flex-col justify-start gap-4"
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
                onClick={() => table.getColumn('category_name')?.setFilterValue(undefined)}
                className="font-medium"
              >
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((cat) => {
                const isActive = table.getColumn('category_name')?.getFilterValue() === cat.name
                return (
                  <DropdownMenuCheckboxItem
                    key={cat.id}
                    checked={!!isActive}
                    // chọn 1 category sẽ set filter về đúng tên category
                    onCheckedChange={(checked) => {
                      if (checked) {
                        table.getColumn('category_name')?.setFilterValue(cat.name)
                      } else {
                        table.getColumn('category_name')?.setFilterValue(undefined)
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
      <TabsContent
        value="all"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
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
        <div className="flex items-center justify-between px-4">
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
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]


const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export const schemaCategory = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })
);
type Props = {
  item: z.infer<typeof schema>;
  categories: z.infer<typeof schemaCategory>;
};
const TableCellViewer = ({ item, categories }: Props) => {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.title}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.title}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={item.title} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Category</Label>
                <Select defaultValue={item.category_name}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>

                  <SelectContent >
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>

                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">yes</SelectItem>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="del">del</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select defaultValue={item.reviewer}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
