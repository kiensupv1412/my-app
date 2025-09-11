/*
 * path: components/media/media-detail.tsx
 */

import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile'; // hook của bạn
import { IconCopy, IconDownload, IconTrash } from '@tabler/icons-react';
import { z } from 'zod';

// schema giống bạn đã định nghĩa
export const schemaMedia = z.object({
    id: z.number(),
    name: z.string(),
    file_name: z.string(),
    file_url: z.string().url(),
    file_size: z.number().nullable().optional(),
    mime: z.string(),
    alt: z.string().nullable().optional(),
    caption: z.string().nullable().optional(),
    thumbnail: z.string().nullable().optional(),
    height: z.number().nullable().optional(),
    width: z.number().nullable().optional(),
    created_at: z.any().optional(),
    updated_at: z.any().optional(),
});
type MediaItem = z.infer<typeof schemaMedia>;

type Props = {
    item: MediaItem;
    onDelete?: (id: number) => void;
};

function toSize(n?: number | null) {
    const v = typeof n === 'number' ? n : 0;
    if (v < 1024) return v + ' B';
    if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB';
    if (v < 1024 * 1024 * 1024) return (v / 1024 / 1024).toFixed(1) + ' MB';
    return (v / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

export function MediaDetail({ item, onDelete }: Props) {
    const isMobile = useIsMobile();
    const src = item.thumbnail ? item.thumbnail : item.file_url;

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(item.file_url);
        } catch (e) {
            console.error('Copy URL error:', e);
        }
    }

    function downloadHref() {
        // dùng thẻ <a download> thay vì mở new tab
        const a = document.createElement('a');
        a.href = item.file_url;
        a.download = item.file_name || item.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    return (
        <Drawer direction={isMobile ? 'bottom' : 'right'}>
            {/* Ô ảnh trong GRID */}
            <DrawerTrigger asChild>
                <button
                    className="group relative block overflow-hidden rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    title={item.name}
                >
                    <div className="aspect-square w-full overflow-hidden">
                        <img
                            src={src}
                            alt={item.alt ? item.alt : item.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.src = '/placeholder.png';
                            }}
                        />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 translate-y-6 bg-gradient-to-t from-black/70 to-black/0 p-2 text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="truncate text-xs">{item.name}</div>
                        <div className="flex items-center justify-between text-[10px] text-white/80">
                            <span className="truncate">{item.mime}</span>
                            <span>{toSize(item.file_size)}</span>
                        </div>
                    </div>
                </button>
            </DrawerTrigger>

            {/* Drawer hiển thị ảnh lớn + metadata */}
            <DrawerContent className={isMobile ? 'max-h-[85vh]' : 'max-w-[720px]'}>
                <DrawerHeader className="gap-1">
                    <DrawerTitle className="truncate">{item.name}</DrawerTitle>
                    <DrawerDescription>Preview &amp; thông tin tập tin</DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                    {/* Ảnh lớn */}
                    <div className="rounded-lg border">
                        <div className="bg-muted/30">
                            <img
                                src={item.file_url}
                                alt={item.alt ? item.alt : item.name}
                                className="max-h-[60vh] w-full object-contain"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Thông tin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                            <div className="text-muted-foreground">Tên hiển thị</div>
                            <div className="font-medium break-all">{item.name}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground">File name</div>
                            <div className="break-all">{item.file_name}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground">MIME</div>
                            <div>{item.mime}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground">Kích thước</div>
                            <div>{toSize(item.file_size)}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-muted-foreground">Kích thước ảnh (nếu có)</div>
                            <div>
                                {item.width && item.height ? item.width + '×' + item.height + ' px' : '—'}
                            </div>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <div className="text-muted-foreground">URL</div>
                            <div className="truncate">{item.file_url}</div>
                        </div>
                        {item.caption ? (
                            <div className="space-y-1 sm:col-span-2">
                                <div className="text-muted-foreground">Caption</div>
                                <div className="break-words">{item.caption}</div>
                            </div>
                        ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" onClick={handleCopy}>
                            <IconCopy className="mr-2 h-4 w-4" />
                            Copy URL
                        </Button>
                        <Button size="sm" variant="secondary" onClick={downloadHref}>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Tải xuống
                        </Button>
                        {typeof onDelete === 'function' ? (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDelete(item.id)}
                            >
                                <IconTrash className="mr-2 h-4 w-4" />
                                Xoá
                            </Button>
                        ) : null}
                    </div>
                </div>

                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">Đóng</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}