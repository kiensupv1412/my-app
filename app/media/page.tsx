/*
 * path: app/media/page.tsx
 */

'use client';

import { MediaDetail } from '@/components/media/media-detail';
import { UploadMediaDialog } from '@/components/media/upload-media-dialog';
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { useAppToast } from '@/components/providers/app-toast';
import { Button } from '@/components/ui/button';
import {
    type Folder,
    apiCreateFolder,
    apiDeleteMedia,
    useFolders,
    useMediaList,
} from '@/lib/media.api';
import { IconChevronLeft, IconPlus } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function MediaPage() {
    const router = useRouter();
    const { success } = useAppToast();
    const [currentFolderId, setCurrentFolderId] = React.useState<number | null>(null);
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(48);

    const { folders, isLoading: foldersLoading, refetch: refetchFolders } = useFolders();
    const { media, total, isLoading: mediaLoading, refetch: refetchMedia } = useMediaList({ page, pageSize, folder_id: currentFolderId });
    const currentFolder = React.useMemo(() => folders.find((f) => f.id === currentFolderId) || null, [folders, currentFolderId],
    );
    const [loading, setLoading] = React.useState<boolean>(false);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    async function handleCreateFolder() {
        const name = prompt('Tên folder mới:');
        if (!name) return;
        await apiCreateFolder(name, 1);
        refetchFolders();
    }

    async function handleDelete(id: number) {
        const ok = await confirmDelete({
            title: `Xoá ảnh`,
            description: 'Ảnh sẽ bị xoá vĩnh viễn. Bạn chắc chứ?',
            confirmText: 'Xoá',
            cancelText: 'Huỷ',
        });
        if (!ok) return;
        await apiDeleteMedia(id);
        refetchMedia();
        success();
    }
    /* ---- UI: Folder card (giữ nguyên markup cũ) ---- */
    function FolderCard({ f, onOpen }: { f: Folder; onOpen?: (id: number) => void }) {
        const itemText =
            typeof f.total === 'number'
                ? f.total === 0
                    ? 'Folder is empty'
                    : `${f.total} item${f.total > 1 ? 's' : ''}`
                : '—';

        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => {
                    // khi mở 1 folder → reset page về 1
                    setPage(1);
                    onOpen?.(f.id);
                }}
                className="group relative w-full text-left"
                title={f.name}
            >
                <div className="relative bg-background transition-colors hover:bg-accent/30">
                    <div className="relative border rounded-sm h-28 w-full overflow-hidden">
                        {/* icon/cover */}
                        {f.cover_url ? (
                            <img
                                src={f.cover_url}
                                alt={f.name}
                                className="h-full w-full object-cover"
                                onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/placeholder.png')}
                            />
                        ) : (
                            <div className="flex h-full w-full">
                                <svg viewBox="0 0 24 24" className="h-10 w-10 text-indigo-600" fill="currentColor">
                                    <path d="M10.5 6a1.5 1.5 0 0 1 1.06.44l.75.75c.28.28.66.44 1.06.44H19a2 2 0 0 1 2 2v7.5A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5V8A2 2 0 0 1 5 6h5.5Z" />
                                </svg>
                            </div>
                        )}

                        {/* menu ba chấm */}
                        <div className="absolute right-2 top-2">
                            <button
                                className="rounded-md bg-background/80 px-1.5 py-1 text-xs text-foreground/80 hover:bg-background"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <span className="inline-block h-1 w-1 rounded-full bg-foreground/70" />
                                <span className="mx-0.5 inline-block h-1 w-1 rounded-full bg-foreground/70" />
                                <span className="inline-block h-1 w-1 rounded-full bg-foreground/70" />
                            </button>
                        </div>

                        {/* name pill full width */}
                        <div className="absolute bottom-0 left-0 right-0">
                            <div className="w-full bg-gray-200 px-3 py-2 text-sm font-semibold text-foreground text-center">
                                {f.name}
                            </div>
                        </div>
                    </div>
                </div>

                {/* caption */}
                <div className="mt-3">
                    <div className="line-clamp-1 text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{itemText}</div>
                </div>
            </div>
        );
    }

    /* ---- BACK button khi đang ở trong folder ---- */
    function FolderHeader() {
        if (currentFolderId === null) return (
            <div className="flex justify-between">
                <div className="flex items-center">
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium">All media</span>
                    </div>
                </div>
                <UploadMediaDialog
                    currentFolderId={currentFolderId}
                    onUploaded={() => {
                        setPage(1);
                        refetchMedia();   // ✅ gọi lại SWR
                    }}
                >
                    <Button variant="outline" size="sm">
                        <IconPlus />
                        <span className="hidden lg:inline">Upload Image</span>
                    </Button>
                </UploadMediaDialog>
            </div>
        );

        return (
            <div className="flex justify-between">
                <div className="flex items-center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setPage(1);
                            setCurrentFolderId(null);
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
                    currentFolderId={currentFolderId}
                    onUploaded={
                        () => {
                            setPage(1)
                            refetchMedia()
                        }}
                >
                    <Button variant="outline" size="sm">
                        <IconPlus />
                        <span className="hidden lg:inline">Upload Image</span>
                    </Button>
                </UploadMediaDialog>
            </div >
        );
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-4">
            <div className='space-y-4'>
                <FolderHeader />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                    {currentFolderId === null && (
                        <>
                            <button
                                onClick={handleCreateFolder}
                                className="group relative w-full text-left h-28"
                                title="Create folder"
                            >
                                <div className="rounded-xl border border-dashed bg-background p-3 transition-colors hover:bg-accent/30">
                                    <div className="flex h-24 w-full items-center justify-center rounded-lg bg-muted/60">
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg">
                                                <svg className="h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1Z" />
                                                </svg>
                                            </span>
                                            <span className="mt-2 text-xs font-medium">Create folder</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            {folders.map((f) => (
                                <FolderCard
                                    key={f.id}
                                    f={f}
                                    onOpen={(id) => {
                                        setPage(1);
                                        router.push(`/media/${id}`);
                                    }}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* GRID 2: MEDIA LIST (giữ layout cũ) */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 flex-1">
                    {loading && (
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground">Đang tải…</div>
                    )}

                    {!loading &&
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

                    {!loading && media.length === 0 && (
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground">Không có ảnh nào.</div>
                    )}
                </div>
            </div>
            {/* FOOTER: Phân trang + Hiển thị */}
            <div className="flex items-center justify-between mt-auto border-t py-2">
                <div className="text-xs text-muted-foreground">
                    Trang {page}/{totalPages} · Tổng {total} ảnh
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Hiển thị</label>
                    <select
                        className="h-8 rounded-md border bg-background px-2 text-sm"
                        value={pageSize}
                        onChange={(e) => {
                            setPage(1);
                            setPageSize(Number(e.target.value));
                        }}
                    >
                        {[24, 48, 96, 150].map((n) => (
                            <option key={n} value={n}>
                                {n}/trang
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}