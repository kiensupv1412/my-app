'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { MediaDetail } from '@/components/media/media-detail';
import { useMediaPage } from '@/hooks/use-media';
import Pagination from '@/components/ui/pagination';
import { usePageLimit, usePagination } from '@/hooks/usePagination';
import { useFolders } from '@/hooks/use-folders';
import { Folder } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { IconChevronLeft } from '@tabler/icons-react';
import { UploadMedia } from '@/components/actions/upload-media';

/*
 * path: app/media/page.tsx
 */
export default function MediaPage() {
    // Chỉ việc bọc Suspense quanh phần dùng search params
    return (
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Đang tải…</div>}>
            <MediaPageInner />
        </Suspense>
    );
}

// ---- TẤT CẢ LOGIC CŨ CHUYỂN SANG ĐÂY (giữ nguyên cấu trúc/props) ----
function MediaPageInner() {
    const router = useRouter();
    const sp = useSearchParams();
    const { page, setPage, limit, setLimit } = usePageLimit(1, 40);

    const folderId = React.useMemo(() => {
        const raw = sp.get('folder');
        if (raw === null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [sp]);

    const { folders, foldersError, foldersLoading } = useFolders();

    const currentFolder = React.useMemo(() => {
        return folders.find((folder) => folder.id === folderId) ?? null;
    }, [folderId, folders]);

    const { data: media = [], meta, mediaLoading, mutate, remove } =
        useMediaPage(page, limit, folderId);
    const pagination = usePagination({
        limit,
        setLimit,
        meta,
        page,
        setPage,
    });

    async function handleDelete(id: number) {
        const ok = await confirmDelete({
            title: 'Xoá ảnh',
            description: 'Xoá vĩnh viễn?',
            confirmText: 'Xoá',
            cancelText: 'Huỷ',
        });
        if (!ok) return;
        try {
            await mutate((cur: any) => {
                if (!cur) return cur;
                const nextData = (cur.data ?? []).filter((m: any) => m.id !== id);
                const nextTotal = Math.max(0, (cur.meta?.total ?? 0) - 1);
                return { ...cur, data: nextData, meta: { ...(cur.meta || {}), total: nextTotal } };
            }, false);

            await remove(id);
            toast.success('Đã xoá ảnh');
        } catch (e: any) {
            toast.error(e?.message ?? 'Xoá thất bại');
        }
    }


    function FolderCard({ folder, onOpen }: { folder: Folder; onOpen?: (id: number) => void }) {
        const itemText =
            typeof folder.media_count === 'number'
                ? folder.media_count === 0
                    ? 'Trống'
                    : `${folder.media_count} mục`
                : '—';
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => {
                    setPage(1);
                    onOpen?.(folder.id);
                }}
                className="group relative w-full text-left"
                title={folder.name}
            >
                <div className="relative bg-background transition-colors hover:bg-accent/30">
                    <div className="relative border rounded-sm h-28 w-full">
                        <div className="flex h-full w-full justify-between">
                            <svg viewBox="0 0 24 24" className="h-10 w-10 text-indigo-600" fill="currentColor">
                                <path d="M10.5 6a1.5 1.5 0 0 1 1.06.44l.75.75c.28.28.66.44 1.06.44H19a2 2 0 0 1 2 2v7.5A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5V8A2 2 0 0 1 5 6h5.5Z" />
                            </svg>
                            <div className="text-xs text-muted-foreground pt-2 pr-2">{itemText}</div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0">
                            <div className="w-full bg-gray-200 px-3 py-2 text-sm font-semibold text-foreground text-center">
                                {folder.name}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 p-4">
            <div className="flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
                <div className="flex justify-between">
                    <div className="flex items-center">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={folderId ? () => router.push('/media') : undefined}
                            className="gap-1"
                        >
                            <IconChevronLeft className="h-4 w-4" />
                            All media
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            <span className="mx-2">/</span>
                            <span className="font-medium">
                                {folderId ? currentFolder?.name ?? '' : 'All media'}
                            </span>
                        </div>
                    </div>
                    <UploadMedia
                        folder_id={folderId}
                        callback={() => {
                            mutate(undefined, true);
                        }}
                    />
                </div>
                {/* Không có folderId -> hiển thị danh sách folder */}
                {!folderId && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                        <button className="group relative w-full text-left h-28" title="Create folder">
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

                        {!foldersLoading &&
                            folders?.length &&
                            folders.map((folder: Folder) => (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    onOpen={(id) => router.push(`/media?folder=${id}`)}
                                />
                            ))}
                    </div>
                )}

                {/* MEDIA GRID */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="h-full min-h-0 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable] content-start grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 flex-1">
                        {media ? (
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
                            ))
                        ) : (
                            <div className="col-span-full py-6 text-center text-sm text-muted-foreground">Đang tải…</div>
                        )}

                        {!mediaLoading && media.length === 0 && (
                            <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                                {folderId ? 'Không có ảnh nào.' : 'Không có mục nào.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto border-t py-2">
                <Pagination
                    {...pagination}
                    onChangeLimit={(n) => {
                        setLimit(n);
                        setPage(1);
                    }}
                    perPageOptions={[40, 80, 120, 160]}
                />
            </div>
        </div>
    );
}
