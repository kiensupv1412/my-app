/*
 * path: components/dashboard/data-articles.tsx
 */
"use client"

import {
  IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight,
  IconCircleCheckFilled, IconDotsVertical, IconEyeOff, IconLayoutColumns, IconPlus, IconTrash,
  IconTrendingUp
} from "@tabler/icons-react"
import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
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
import { openModal } from '@/hooks/useModal'
import { useAppToast } from '@/components/providers/app-toast'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/drawer"
import { AspectRatio } from "../ui/aspect-ratio"
import { Separator } from "../ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"

function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit", ...opts }).format(date)
}

const tableSchema = z.object({
  id: z.number(),
  title: z.string(),
  category_name: z.string(),
  status: z.string(),
  thumb: z.object({
    file_url: z.string()
  }),
  updated_at: z.string(),
})

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
        const categories = table.options.meta?.categories ?? [];
        return <Link href={`/news/edit?id=${row.original.id}`}>{row.original.title}</Link>
        // <TableCellViewer article={row.original} categories={categories} />
      },
      enableHiding: false,
      meta: { className: "whitespace-normal" }
    },
    {
      accessorKey: "category_id",
      header: "Category",
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
  articles: any | [];
  categories: any | [];
  serverPage: number;
  pageCount?: number;
  totalItems?: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
};

export function DataArticles({
  articles, categories: initialCategories,
  serverPage, pageCount, isLoading, totalItems, pageSize,
  onPageChange, onPageSizeChange
}: Props) {
  const { success } = useAppToast();

  const [categories, setCategories] = React.useState(() => initialCategories);
  React.useEffect(() => setCategories(initialCategories), [initialCategories]);

  const pagination = React.useMemo(() => ({
    pageIndex: Math.max(0, serverPage - 1),
    pageSize,
  }), [serverPage, pageSize]);

  const table = useReactTable({
    data: articles,
    columns: getColumns(),
    meta: { categories },
    state: { pagination },
    manualPagination: true,
    pageCount: pageCount ?? -1,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      const nextPage = (next.pageIndex ?? pagination.pageIndex) + 1; // 1-based
      if (nextPage !== serverPage) onPageChange(nextPage);
      if (next.pageSize && next.pageSize !== pageSize) setPageSize(next.pageSize);
    },
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
          <TabsTrigger value="all">All <span className="secondary">{totalItems ?? articles.length}</span></TabsTrigger>
          <TabsTrigger value="favorite">Favorite <Badge variant="secondary">3</Badge></TabsTrigger>
          <TabsTrigger value="top-view">Top Views <Badge variant="secondary">2</Badge></TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => {
              table.getColumn("title")?.setFilterValue(e.target.value);
              // khi search có thể muốn về trang 1:
              onPageChange(1);
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
                    onCheckedChange={(checked) => {
                      if (checked) table.getColumn('category_id')?.setFilterValue(cat.name)
                      else table.getColumn('category_id')?.setFilterValue(undefined)
                      onPageChange(1) // filter thì về trang 1
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
            {/* page size (áp vào serverPageSize nếu cần) */}
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">per page</Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  const v = Number(value);
                  if (!Number.isFinite(v) || v <= 0) return;
                  onPageSizeChange(v);
                  onPageChange(1);
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((ps) => (
                    <SelectItem key={ps} value={`${ps}`}>
                      {ps}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {serverPage}{pageCount ? <> of {pageCount}</> : null}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onPageChange(1)}
                disabled={serverPage <= 1 || isLoading}
              >
                <span className="sr-only">first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange(serverPage - 1)}
                disabled={serverPage <= 1 || isLoading}
              >
                <span className="sr-only">previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => onPageChange(serverPage + 1)}
                disabled={(pageCount ? serverPage >= pageCount : false) || isLoading}
              >
                <span className="sr-only">next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => pageCount && onPageChange(pageCount)}
                disabled={(pageCount ? serverPage >= pageCount : true) || isLoading}
              >
                <span className="sr-only">last page</span>
                <IconChevronsRight />
              </Button>
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
  )
}


// function TableCellViewer({
//   article,
//   categories
// }: {
//   article: any;
//   categories: any;
// }) {
//   const isMobile = useIsMobile();
//   const [loading, setLoading] = React.useState(false)
//   // async function handleSubmit() {
//   //     setLoading(true);
//   //     try {
//   //         let payload: any = {
//   //             title: form.title,
//   //             slug: form.slug,
//   //             status: form.status,
//   //             category_id: form.category,
//   //             thumb_id: article?.thumb_id,
//   //             thumb: article?.thumb
//   //         };

//   //         if (mode !== 'news') {
//   //             payload = {
//   //                 ...payload,
//   //                 description: "",
//   //                 body: await plateToHtml(contentEditor),
//   //                 content: JSON.stringify(contentEditor?.children ?? []),
//   //             };
//   //         }

//   //         if (mode === 'create') {
//   //             await createArticleOptimistic(payload);
//   //             router.push('/news');
//   //         } else {
//   //             await updateArticleOptimistic(article?.id, payload);
//   //         }
//   //         success();
//   //         onResolve();
//   //     } catch (e) {
//   //         error();
//   //         // onClose();
//   //     } finally {
//   //         setLoading(false);
//   //     }
//   // }

//   return (
//     <Drawer direction={isMobile ? 'bottom' : 'right'}>
//       <DrawerTrigger asChild>
//         <Button variant="link" className="text-foreground w-fit px-0 text-left">
//           {article?.title}
//         </Button>
//       </DrawerTrigger>
//       <DrawerContent>
//         <DrawerHeader className="gap-1">
//           <DrawerTitle>{article?.title}</DrawerTitle>
//           <DrawerDescription>
//             Showing total visitors for the last 6 months
//           </DrawerDescription>
//         </DrawerHeader>
//         <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
//           {/* Header (trước đây là DrawerHeader) */}
//           <AspectRatio ratio={16 / 9}>
//             <MediaThumb
//               src={article?.thumb?.file_url}
//               alt={article?.title ?? 'thumbnail'}
//               className="h-full w-full rounded-sm object-cover dark:brightness-[0.2] dark:grayscale"
//             />
//           </AspectRatio>
//           <Separator />
//           <div className="grid gap-2">
//             <div className="flex gap-2 leading-none font-medium">
//               Trending up by 5.2% this month
//               <IconTrendingUp className="size-4" />
//             </div>
//             <div className="text-muted-foreground">
//               Showing total visitors for the last 6 months. This is just some random text to test the layout.
//               It spans multiple lines and should wrap around.
//             </div>
//           </div>

//           <Separator />

//           {/* Form */}
//           <form
//             className="flex flex-col gap-4"
//             onSubmit={(e) => {
//               e.preventDefault();
//               // handleSubmit();
//             }}
//           >
//             <div className="flex flex-col gap-3">
//               <Label htmlFor="header">Header</Label>
//               <Input
//                 id="header"
//                 value={article?.title}
//               />
//             </div>

//             <div className="flex flex-col gap-3">
//               <Label htmlFor="slug">Slug</Label>
//               <Input
//                 id="slug"
//                 value={article?.slug}
//               />
//             </div>

//             <div className="flex flex-col gap-3 md:flex-row">
//               <div className="flex-1 gap-3">
//                 <Label>Category</Label>
//                 <Select value={article?.category_id}>
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select a category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {categories.map((c) => (
//                       <SelectItem key={c.id} value={String(c.id)}>
//                         {c.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex-1 gap-3">
//                 <Label>Status</Label>
//                 <Select value={article?.status}  >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select a status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="yes">yes</SelectItem>
//                     <SelectItem value="draft">draft</SelectItem>
//                     <SelectItem value="del">del</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Footer (thay cho DrawerFooter) */}
//             <div className="flex justify-end gap-2 pt-1">
//               <Button type="submit"  >
//                 Save
//               </Button>
//               <DrawerClose asChild>
//                 <Button type="button" variant="outline"  >
//                   Done
//                 </Button>
//               </DrawerClose>

//             </div>
//           </form>
//         </div>
//       </DrawerContent>
//     </Drawer>
//   );
// }
