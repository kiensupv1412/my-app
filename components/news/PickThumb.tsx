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
import { MediaItem } from '@/types';
import { Separator } from '../ui/separator';
import { useMediaPage } from '@/hooks/use-media';
import Pagination from '../ui/pagination';
import { usePageLimit, usePagination } from '@/hooks/usePagination';

type Props = {
    thumb: MediaItem | undefined;
    onConfirmAction: (media: MediaItem | undefined) => void;
    fallbackUrl?: string;           // ảnh mặc định khi chưa có thumb
    overrideTriggerUrl?: string;    // URL ép để hiển thị ở trigger (preview cục bộ)
};

export default function PickThumb({ thumb, onConfirmAction, fallbackUrl, overrideTriggerUrl }: Props) {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<MediaItem | undefined>(thumb);

    const commit = React.useCallback(() => {
        if (selected?.id == thumb?.id) return;
        onConfirmAction?.(selected);
        setOpen(false);
    }, [onConfirmAction, selected]);

    const { page, setPage, limit, setLimit } = usePageLimit(1, 40);
    const { data: media = [], meta, mediaLoading, mutate } =
        useMediaPage(page, limit);

    const pagination = usePagination({
        limit,
        setLimit,
        meta,
        page,
        setPage
    });


    const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(' ');


    const triggerSrc =
        overrideTriggerUrl
        ?? selected?.file_url
        ?? fallbackUrl
        ?? '/thumb-1920x1080.png';


    const bgItems = media.filter(m => m.is_background);
    const normalItems = media.filter(m => !m.is_background);

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
                    </DialogDescription>
                </DialogHeader>

                {/* Grid ảnh: cao, scroll dọc */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
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
                                        "relative h-auto w-full overflow-hidden rounded-md border",
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
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
                                        "relative w-full overflow-hidden rounded-md border",
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
                <DialogFooter className="px-4 py-3 border-t bg-background flex items-center justify-between gap-3">
                    <Pagination {...pagination}
                        onChangeLimit={(n) => {
                            setLimit(n);
                            setPage(1);
                        }}
                        perPageOptions={[40, 80, 120, 160]} />
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}  >Hủy</Button>
                        <Button type="button" onClick={commit} disabled={selected?.id == thumb?.id}>Chọn</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}