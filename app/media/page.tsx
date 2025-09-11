/*
 * path: app/media/page.tsx
 */

'use client';

import { MediaDetail } from '@/components/media/media-detail';
import { UploadMediaDialog } from '@/components/media/upload-media-dialog';
import { useRootData } from '@/components/providers/root-data';
import { Button } from '@/components/ui/button';
import { MediaItem, apiCreateFolder, apiDeleteMedia, apiListFolders, apiListMediaByFolder, type Folder } from '@/lib/media.api';
import { IconChevronLeft, IconPlus } from '@tabler/icons-react';
import * as React from 'react';

/* ------- utils ------- */
function toSize(n?: number | null) {
    const v = typeof n === 'number' ? n : 0;
    if (v < 1024) return v + ' B';
    if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB';
    if (v < 1024 * 1024 * 1024) return (v / 1024 / 1024).toFixed(1) + ' MB';
    return (v / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

export default function MediaPage() {
    const rd = useRootData();

    /* ---- FOLDER STATE ---- */
    const [folders, setFolders] = React.useState<Folder[]>([]);
    const [currentFolderId, setCurrentFolderId] = React.useState<number | null>(null);
    const currentFolder = React.useMemo(
        () => folders.find((f) => f.id === currentFolderId) || null,
        [folders, currentFolderId],
    );

    /* ---- MEDIA STATE ---- */
    // root-data (SSR) có thể trả raw rows => normalize cho lần đầu
    const mediaRoot = rd && rd.media ? rd.media : { rows: [] };
    const initialList = Array.isArray(mediaRoot.rows) ? mediaRoot.rows : [];
    const normalized = initialList
        .map((m: any) => normalizeMediaItem(m))
        .filter((x) => x && x.id && x.file_url);

    const [items, setItems] = React.useState<MediaItem[]>(normalized);

    function normalizeMediaItem(m: any): MediaItem {
        return {
            id: Number(m?.id ?? 0),
            site: m?.site,
            user_id: m?.user_id,
            media_type: m?.media_type ? String(m.media_type) : undefined,
            uuid: m?.uuid ? String(m.uuid) : undefined,
            name:
                m?.name ? String(m.name) :
                    m?.original_name ? String(m.original_name) :
                        m?.file_name ? String(m.file_name) : 'Untitled',
            file_name:
                m?.file_name ? String(m.file_name) :
                    m?.stored_name ? String(m.stored_name) : '',
            file_url:
                m?.file_url ? String(m.file_url) :
                    m?.url ? String(m.url) : '',
            file_size:
                m?.file_size !== undefined ? Number(m.file_size) :
                    m?.size !== undefined ? Number(m.size) : 0,
            mime: m?.mime ? String(m.mime) : 'application/octet-stream',
            alt: m?.alt ?? null,
            caption: m?.caption ?? null,
            thumbnail: m?.thumbnail ?? null,
            width: m?.width !== undefined ? Number(m.width) : null,
            height: m?.height !== undefined ? Number(m.height) : null,
            created_at: m?.created_at,
            updated_at: m?.updated_at,
        };
    }
    // 1) load folders lúc mount
    React.useEffect(() => {
        apiListFolders()
            .then(setFolders)
            .catch((e) => console.error('[folders]', e));
    }, []);

    // 2) khi đổi folder -> fetch media theo folder (null = root)
    React.useEffect(() => {
        (async () => {
            try {
                const resp = await apiListMediaByFolder(currentFolderId);
                const list = Array.isArray(resp.rows) ? resp.rows : [];
                // resp.rows đã normalize trong api; vẫn đảm bảo filter chắc chắn
                setItems(list.filter((x) => x && x.id && x.file_url));
            } catch (e) {
                console.error('[media by folder]', e);
            }
        })();
    }, [currentFolderId]);
    async function handleCreateFolder() {
        const name = prompt('Tên folder mới:');
        if (!name) return;
        try {
            // giả sử site = 1
            const f = await apiCreateFolder(name, 1);
            setFolders((prev) => [...prev, f]);
        } catch (e) {
            console.error('Create folder error:', e);
        }
    }

    function CreateFolderCard({ onCreate }: { onCreate: () => void }) {
        return (
            <button
                onClick={onCreate}
                className="group relative w-full text-left h-28"
                title="Create folder"
            >
                <div className="rounded-xl border border-dashed bg-background p-3 transition-colors hover:bg-accent/30">
                    <div className="flex h-24 w-full items-center justify-center rounded-lg bg-muted/60">
                        <div className="flex flex-col items-center text-muted-foreground">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg">
                                <svg
                                    className="h-8 w-8 text-indigo-500"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1Z" />
                                </svg>
                            </span>
                            <span className="mt-2 text-xs font-medium">Create folder</span>
                        </div>
                    </div>
                </div>
            </button>
        );
    }
    async function handleDelete(id: number) {
        try {
            await apiDeleteMedia(id);
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            console.error('Delete error:', e);
        }
    }

    /* ---- UI: Folder card ---- */
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
                onClick={() => onOpen?.(f.id)}
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
        if (currentFolderId === null) return null;
        return (
            <div className="flex justify-between">
                <div className="flex items-center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentFolderId(null)}
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
                <UploadMediaDialog setItems={setItems} currentFolderId={currentFolderId}>
                    <Button variant="outline" size="sm">
                        <IconPlus />
                        <span className="hidden lg:inline">Upload Image</span>
                    </Button>
                </UploadMediaDialog>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            <FolderHeader />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {currentFolderId === null && (
                    <>
                        <CreateFolderCard
                            onCreate={async () => {
                                const name = prompt('Tên folder mới:');
                                if (!name) return;
                                try {
                                    const f = await apiCreateFolder(name, 1);
                                    // thêm và có thể tự động mở folder:
                                    setFolders((prev) => [...prev, f]);
                                    // mở ngay folder mới:
                                    // setCurrentFolderId(f.id);
                                } catch (e) {
                                    console.error('Create folder error:', e);
                                }
                            }}
                        />
                        {folders.map((f) => (
                            <FolderCard key={f.id} f={f} onOpen={setCurrentFolderId} />
                        ))}
                    </>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {items.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-lg border py-16 text-sm text-muted-foreground">
                        <div className="rounded-full border px-3 py-1">Chưa có media nào</div>
                        <div>
                            Tải lên bằng nút <span className="font-medium">Upload Media</span>.
                        </div>
                    </div>
                ) : (
                    items.map((m) => (
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
                )}
            </div>
            <div className="px-1 text-xs text-muted-foreground">Tổng: {items.length} mục</div>
        </div>
    );
}