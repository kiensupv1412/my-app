/*
 * path: components/media/media-detail.tsx
 */

import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile'; // hook của bạn
import { IconCopy, IconDownload, IconTrash } from '@tabler/icons-react';
import { z } from 'zod';
import React from 'react';
import { SquareArrowOutUpRight } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Folders, MediaItem } from '@/types';

type Props = {
    folders: Folders;
    item: MediaItem;
    onDelete: (id: number) => void;
};


/*
 * path: components/media/media-detail.tsx
 */
export function MediaDetail({ folders, item, onDelete }: Props) {
    // Nếu item.folder_id là null, chọn 'uploads' làm giá trị mặc định
    const [selectedFolderId, setSelectedFolderId] = React.useState(item.folder_id ?? 'uploads');

    // Hàm để xử lý khi chọn folder
    const handleSelectFolder = (folderId: string | number) => {
        setSelectedFolderId(folderId);
    };

    const isMobile = useIsMobile();
    const src = item.thumbnail ? item.thumbnail : item.file_url;

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(item.file_url);
        } catch (e) {
            console.error("Copy URL error:", e);
        }
    }

    function downloadHref() {
        const a = document.createElement("a");
        a.href = item.file_url;
        a.download = item.file_name || item.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // Tìm folder từ folders dựa trên selectedFolderId
    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) || { name: 'uploads' };

    return (
        <Drawer direction={isMobile ? "bottom" : "right"}>
            <DrawerTrigger asChild>
                <div className="group relative block bg-background" title={item.name}>
                    <div className="aspect-square w-full">
                        <img
                            src={src}
                            alt={item.alt ? item.alt : item.name}
                            className="h-full w-full rounded-sm object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                                const el = e.currentTarget as HTMLImageElement;
                                el.src = "/thumb-default.jpeg";
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
                </div>
            </DrawerTrigger>

            <DrawerContent className={isMobile ? "max-h-[85vh]" : "max-w-[768px]"}>
                <DrawerHeader className="gap-1">
                    <DrawerTitle className="truncate"> </DrawerTitle>
                    <DrawerDescription> </DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                    <div className="bg-muted/30">
                        <img
                            src={item.file_url}
                            alt={item.alt ? item.alt : item.name}
                            className="max-h-[60vh] w-full object-contain"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                        {item.alt ? item.alt : "null"}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex gap-3 space-y-1">
                            <div className="text-muted-foreground">File folder:</div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="min-w-20 text-xs font-semibold text-muted-foreground select-none">
                                        {selectedFolder.name}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="flex max-h-[500px] min-w-20 flex-col overflow-y-auto" align="start">
                                    <DropdownMenuItem onClick={() => handleSelectFolder('uploads')}>
                                        uploads
                                    </DropdownMenuItem>
                                    {folders.map((folder) => (
                                        <DropdownMenuItem
                                            key={folder.id}
                                            onClick={() => handleSelectFolder(folder.id)}
                                            className="min-w-[80px]"
                                        >
                                            {folder.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-1 flex gap-2">
                            <div className="text-muted-foreground">
                                MIME:
                                <span className="px-2 py-1 bg-muted rounded-md">{item.mime}</span>
                            </div>
                            <div className="text-muted-foreground">
                                File size:
                                <span className="px-2 py-1 bg-muted rounded-md">{toSize(item.file_size)}</span>
                            </div>
                        </div>
                        <div className="space-y-1 gap-2">
                            <div className="text-muted-foreground">Version: </div>
                            <div className="flex gap-2">
                                <div className="px-2 py-1 bg-muted text-muted-foreground rounded-md">
                                    1280x720
                                </div>
                                <div className="px-2 py-1 bg-muted text-muted-foreground rounded-md">
                                    1280x720
                                </div>
                                <div className="px-2 py-1 bg-muted text-muted-foreground rounded-md">
                                    1280x720
                                </div>
                            </div>
                        </div>
                        {item.caption && (
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Caption</div>
                                <div className="break-words">{item.caption}</div>
                            </div>
                        )}
                        {/* Thẻ ảnh (Tags) */}
                        <div className="space-y-1 flex gap-2">
                            <div className="text-muted-foreground">Thẻ: </div>
                            <div className="flex flex-wrap gap-1">
                                <span className="text-xs font-medium px-2 py-1 bg-muted text-muted-foreground rounded-md">
                                    taggg
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-1">
                        <Button size="sm" asChild onClick={handleCopy} className="flex-1">
                            <Link href={item.file_url} target="_blank">
                                <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="sm" onClick={handleCopy} className="flex-1">
                            <IconCopy className="mr-2 h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={downloadHref} className="flex-1">
                            <IconDownload className="mr-2 h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(item.id)}
                            className="flex-1"
                        >
                            <IconTrash className="mr-2 h-4 w-4" />
                        </Button>
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

function toSize(n?: number | null) {
    const v = typeof n === 'number' ? n : 0;
    if (v < 1024) return v + ' B';
    if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB';
    if (v < 1024 * 1024 * 1024) return (v / 1024 / 1024).toFixed(1) + ' MB';
    return (v / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}