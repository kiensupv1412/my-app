'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAppToast } from '@/components/providers/app-toast';
import { confirmDelete } from '@/components/modals/confirm-delete-service';
import { MediaDetail } from '@/components/media/media-detail';

import { useUrlPagination } from '@/hooks/use-url-pagination';
import { useMediaPage } from '@/hooks/use-media';
import FolderHeader from '@/components/media/FolderHeader';
import { apiDeleteMedia } from '@/lib/media.api';

type Folder = { id: number; name: string; total?: number; cover_url?: string | null };

export default function MediaPage() {
    const router = useRouter();
    const pathname = usePathname();
    const sp = useSearchParams();
    const { success, error } = useAppToast();

    // folderId từ URL (?folder=123 | không có => null)
    const folderId = React.useMemo(() => {
        const raw = sp.get('folder');
        if (raw === null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [sp]);

    const pag = useUrlPagination({ page: 1, limit: 48 });

    const { data: media = [], meta, isLoading: mediaLoading, mutate: mutateMedia } =
        useMediaPage(pag.page, pag.limit, folderId);


    async function handleDelete(id: number) {
        const ok = await confirmDelete({
            title: 'Xoá ảnh',
            description: 'Ảnh sẽ bị xoá vĩnh viễn. Bạn chắc chứ?',
            confirmText: 'Xoá',
            cancelText: 'Huỷ',
        });
        if (!ok) return;

        try {
            // optimistic update — đúng shape {data, meta}
            await mutateMedia((cur: any) => {
                if (!cur) return cur;
                const nextData = (cur.data ?? []).filter((m: any) => m.id !== id);
                const nextTotal = Math.max(0, (cur.meta?.total ?? 0) - 1);
                return { ...cur, data: nextData, meta: { ...(cur.meta || {}), total: nextTotal } };
            }, false);

            await apiDeleteMedia(id);
            success('Đã xoá ảnh');

            // nếu trang hiện tại rỗng → lùi 1 trang
            const pagesNow = Math.max(1, Math.ceil(((meta.total ?? 0) - 1) / pag.limit));
            if (pag.page > pagesNow) pag.setPage(pagesNow);
        } catch (e: any) {
            // nếu muốn rollback cần giữ prev trước khi mutate
            error(e?.message ?? 'Xoá thất bại');
        } finally {
        }
    }

    // ───── View components (giữ nguyên UI)
    function FolderCard({ folder, onOpen }: { folder: Folder; onOpen?: (id: number) => void }) {
        const itemText =
            typeof folder.total === 'number' ? (folder.total === 0 ? 'Trống' : `${folder.total} mục`) : '—';
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => {
                    pag.setPage(1);
                    onOpen?.(folder.id);
                }}
                className="group relative w-full text-left"
                title={folder.name}
            >
                <div className="relative bg-background transition-colors hover:bg-accent/30">
                    <div className="relative border rounded-sm h-28 w-full overflow-hidden">
                        {folder.cover_url ? (
                            <img
                                src={folder.cover_url}
                                alt={folder.name}
                                className="h-full w-full object-cover"
                                onError={(e) => ((e.currentTarget as HTMLImageElement).src = '/thumb-default.jpeg')}
                            />
                        ) : (
                            <div className="flex h-full w-full">
                                <svg viewBox="0 0 24 24" className="h-10 w-10 text-indigo-600" fill="currentColor">
                                    <path d="M10.5 6a1.5 1.5 0 0 1 1.06.44l.75.75c.28.28.66.44 1.06.44H19a2 2 0 0 1 2 2v7.5A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5V8A2 2 0 0 1 5 6h5.5Z" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0">
                            <div className="w-full bg-gray-200 px-3 py-2 text-sm font-semibold text-foreground text-center">
                                {folder.name}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-1">
                    <div className="text-xs text-muted-foreground">{itemText}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-6 space-y-4">
            <div className="space-y-4">
                <FolderHeader
                    currentFolderId={folderId}
                    currentFolderName={null}
                    onBack={folderId ? () => router.push('/media') : undefined}
                    uploadTargetFolderId={folderId}
                    onUploaded={() => pag.setPage(1)}
                />

                {/* Nếu không có folderId -> danh sách folder (UI giữ nguyên) */}
                {!folderId && (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                        <button
                            // onClick={}
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

                        {/* {folders.map((folder) => (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                onOpen={(id) => router.push(`/media?folder=${id}&page=1&pageSize=${pag.limit}`)}
                            />
                        ))} */}
                    </div>
                )}

                {/* MEDIA GRID (giữ nguyên UI) */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 flex-1">
                    {/* {foldersLoading && (
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground">Đang tải…</div>
                    )} */}

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
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                            {folderId ? 'Không có ảnh nào.' : 'Không có mục nào.'}
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER: phân trang (giữ nguyên UI, dùng pag + meta) */}
            <div className="flex items-center justify-between mt-auto border-t py-2">
                <div className="text-xs text-muted-foreground">
                    Trang {pag.page}/{pag.pageCount ?? 1} · Tổng {meta?.total ?? 0}{' '} {folderId ? 'ảnh' : 'mục'}                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Hiển thị</label>
                    <select
                        className="h-8 rounded-md border bg-background px-1 text-sm"
                        value={pag.limit}
                        onChange={(e) => pag.setLimit(Number(e.target.value))}
                    >
                        {[24, 48, 96, 150].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!meta.prev || mediaLoading}
                            onClick={pag.goPrev}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!meta.next || mediaLoading}
                            onClick={pag.goNext}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}