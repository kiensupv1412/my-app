// app/media/[id]/page.tsx
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconChevronLeft, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { UploadMediaDialog } from '@/components/media/upload-media-dialog';
import { MediaDetail } from '@/components/media/media-detail';
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { useAppToast } from '@/components/providers/app-toast';
import {
    type Folder,
    apiCreateFolder,
    apiDeleteMedia,
    useFolders,
    useMediaList,
} from '@/lib/media.api';

export default function MediaFolderPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const routeParams = useParams<{ id: string }>();

    const { success } = useAppToast();

    // folderId lấy từ URL
    const folderId = React.useMemo<number | null>(() => {
        const raw = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [routeParams]);
    const isValidFolder = folderId !== null;

    // phân trang
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(48);

    // data
    const { folders } = useFolders();
    const { media, total, isLoading: mediaLoading, refetch: refetchMedia } =
        useMediaList({ page, pageSize, folder_id: isValidFolder ? folderId : null });

    const currentFolder = React.useMemo<Folder | null>(
        () => (isValidFolder ? (folders.find(f => f.id === folderId) || null) : null),
        [folders, folderId, isValidFolder]
    );

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    async function handleDelete(id: number) {
        const ok = await confirmDelete({
            title: `Xoá ảnh`,
            description: 'Ảnh sẽ bị xoá vĩnh viễn. Bạn chắc chứ?',
            confirmText: 'Xoá',
            cancelText: 'Huỷ',
        });
        if (!ok) return;
        await apiDeleteMedia(id);
        refetchMedia();    // reload list trong folder hiện tại
        success();
    }

    // Header (giữ UI, chỉ đổi hành vi back → push về /media)
    function FolderHeader() {
        return (
            <div className="flex justify-between">
                <div className="flex items-center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setPage(1);
                            router.push('/media');     // ⬅️ quay về root
                        }}
                        className="gap-1"
                    >
                        <IconChevronLeft className="h-4 w-4" />
                        All media
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        <span className="mx-2">/</span>
                        <span className="font-medium">{currentFolder ? currentFolder.name : 'Folder'}</span>
                    </div>
                </div>
                <UploadMediaDialog
                    currentFolderId={folderId}
                    onUploaded={() => { setPage(1); refetchMedia(); }}
                >
                    <Button variant="outline" size="sm">
                        <IconPlus />
                        <span className="hidden lg:inline">Upload Image</span>
                    </Button>
                </UploadMediaDialog>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-4">
            <div className="space-y-4">
                <FolderHeader />

                {/* Không render lưới Folders khi đang trong folder (giữ logic cũ: chỉ hiện khi currentFolderId === null) */}

                {/* MEDIA LIST */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 flex-1">
                    {mediaLoading && (
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground">Đang tải…</div>
                    )}

                    {!mediaLoading &&
                        media.map((m) => (
                            <MediaDetail
                                key={m.id}
                                item={{
                                    id: m.id,
                                    name: m.name,
                                    file_name: m.file_name,
                                    file_url: m.file_url,
                                    file_size: m.file_size,
                                    mime: m.mime,
                                    alt: m.alt,
                                    caption: m.caption,
                                    thumbnail: m.thumbnail,
                                    height: m.height,
                                    width: m.width,
                                    created_at: m.created_at,
                                    updated_at: m.updated_at,
                                }}
                                onDelete={handleDelete}
                            />
                        ))}

                    {!mediaLoading && media.length === 0 && (
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground">Không có ảnh nào.</div>
                    )}
                </div>
            </div>

            {/* FOOTER: phân trang */}
            <div className="flex items-center justify-between mt-auto border-t py-2">
                <div className="text-xs text-muted-foreground">
                    Trang {page}/{totalPages} · Tổng {total} ảnh
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Hiển thị</label>
                    <select
                        className="h-8 rounded-md border bg-background px-1 text-sm"
                        value={pageSize}
                        onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                    >
                        {[24, 48, 96, 150].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1 || mediaLoading} onClick={() => setPage(p => Math.max(1, p - 1))}>
                            Prev
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages || mediaLoading} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
