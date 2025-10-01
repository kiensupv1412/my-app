// path: components/modals/contents/pickThumb.tsx
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogTitle, DialogContent, DialogDescription,
    DialogFooter, DialogHeader,
    DialogTrigger
} from '@/components/ui/dialog';
import { apiListMedia } from '@/lib/media.api';
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import {
    IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight
} from "@tabler/icons-react";
import { MediaItem } from '@/types';
import { Separator } from '../ui/separator';

type Props = {
    thumb: MediaItem | undefined;
    onConfirmAction: (media: MediaItem | undefined) => void;
    fallbackUrl?: string;           // ảnh mặc định khi chưa có thumb
    overrideTriggerUrl?: string;    // URL ép để hiển thị ở trigger (preview cục bộ)
};

export default function PickThumb({ thumb, onConfirmAction, fallbackUrl, overrideTriggerUrl }: Props) {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<MediaItem | undefined>(thumb);

    // React.useEffect(() => {
    //     setSelected(thumb);
    // }, [thumb?.id]);

    const commit = React.useCallback(() => {
        if (selected?.id == thumb?.id) return;
        onConfirmAction?.(selected);
        setOpen(false);
    }, [onConfirmAction, selected]);

    // server pagination
    const [page, setPage] = React.useState<number>(1);
    const [pageSize, setPageSize] = React.useState<number>(48); // mặc định 24/ trang

    const { data, isLoading, error, mutate } = useSWR(
        ['media-paged', page, pageSize] as const,
        async () => {
            const res = await apiListMedia({ page, pageSize, q: '' });
            return {
                items: res.rows,
                total: res.total,
                page: res.page,
                pageSize: res.pageSize,
            };
        },
        { revalidateOnFocus: false, keepPreviousData: true }
    );

    const items = data?.items ?? [];
    const total = Number(data?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));

    const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(' ');

    const goFirst = () => setPage(1);
    const goPrev = () => setPage(p => Math.max(1, p - 1));
    const goNext = () => setPage(p => Math.min(totalPages, p + 1));
    const goLast = () => setPage(totalPages);

    const onChangePageSize = (val: number) => {
        if (!Number.isFinite(val) || val <= 0) return;
        setPageSize(val);
        setPage(1);
    };
    const triggerSrc =
        overrideTriggerUrl
        ?? selected?.file_url
        ?? fallbackUrl
        ?? '/thumb-1920x1080.png';


    const bgItems = items.filter(m => m.is_background);
    const normalItems = items.filter(m => !m.is_background);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" className="px-0 text-left w-full h-full">
                    <img
                        src={triggerSrc}
                        alt={selected?.alt ?? 'thumbnail'}
                        className="block w-full h-auto"
                    />
                </Button>
            </DialogTrigger>
            <DialogContent
                className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] h-[80vh] max-h-[80vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="px-4 py-3 shrink-0">
                    <DialogTitle>Chọn thumbnail</DialogTitle>
                    <DialogDescription>
                        Click để chọn, double-click để chọn nhanh.
                        {typeof total === 'number' ? ` Đang hiển thị ${items.length} / tổng ${total} ảnh.` : null}
                    </DialogDescription>
                </DialogHeader>

                {/* Grid ảnh: cao, scroll dọc */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {bgItems.map((media) => {
                            const isSel = selected?.id === media.id;
                            const src = media.file_url;
                            return (
                                <button
                                    key={media.id}
                                    type="button"
                                    title={media.alt ?? ""}
                                    onClick={() => setSelected(media)}
                                    onDoubleClick={commit}
                                    className={cx(
                                        "relative h-24 w-full overflow-hidden rounded-md border",
                                        "transition hover:ring-2 hover:ring-primary",
                                        isSel && "ring-2 ring-primary border-primary"
                                    )}
                                >
                                    <img
                                        src={src}
                                        alt={media.alt ?? "thumb"}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                    {isSel && (
                                        <span className="absolute right-1 top-1 text-[10px] rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                                            Đã chọn
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {normalItems.map((media) => {
                            const isSel = selected?.id === media.id;
                            const src = media.file_url;
                            return (
                                <button
                                    key={media.id}
                                    type="button"
                                    title={media.alt ?? ""}
                                    onClick={() => setSelected(media)}
                                    onDoubleClick={commit}
                                    className={cx(
                                        "relative h-24 w-full overflow-hidden rounded-md border",
                                        "transition hover:ring-2 hover:ring-primary",
                                        isSel && "ring-2 ring-primary border-primary"
                                    )}
                                >
                                    <img
                                        src={src}
                                        alt={media.alt ?? "thumb"}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                    {isSel && (
                                        <span className="absolute right-1 top-1 text-[10px] rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                                            Đã chọn
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer: page size + pagination + actions */}
                <DialogFooter className="px-4 py-3 border-t shrink-0 bg-background flex items-center justify-between gap-3">
                    {/* Page size + info */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-sm">Per page</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => onChangePageSize(Number(v))}
                            >
                                <SelectTrigger className="w-20 h-8">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[24, 36, 48, 72, 96].map(ps => (
                                        <SelectItem key={ps} value={String(ps)}>{ps}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Trang {page}{totalPages ? ` / ${totalPages}` : ""}{typeof total === "number" ? ` • ${total} ảnh` : ""}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:inline-flex"
                            onClick={goFirst} disabled={page <= 1 || isLoading}>
                            <IconChevronsLeft />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={goPrev} disabled={page <= 1 || isLoading}>
                            <IconChevronLeft />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={goNext} disabled={(totalPages ? page >= totalPages : false) || isLoading}>
                            <IconChevronRight />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:inline-flex"
                            onClick={goLast} disabled={(totalPages ? page >= totalPages : true) || isLoading}>
                            <IconChevronsRight />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}  >Hủy</Button>
                        <Button type="button" onClick={commit} disabled={selected?.id == thumb?.id}>Chọn</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}