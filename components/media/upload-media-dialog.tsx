/*
 * path: components/media/upload-media-dialog.tsx
 */
'use client';

import { IconPlus } from '@tabler/icons-react';
import * as React from 'react';

import { useAppToast } from '@/components/providers/app-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { apiUpload } from '@/lib/media.api';

type PickedFile = { file: File; url: string; error?: string };

type MediaItem = {
    id: number;
    site?: number;
    user_id?: number;
    media_type?: string;
    uuid?: string;
    name: string;
    file_name: string;
    file_url: string;
    file_size?: number | null;
    mime: string;
    alt?: string | null;
    caption?: string | null;
    thumbnail?: string | null;
    width?: number | null;
    height?: number | null;
    created_at?: any;
    updated_at?: any;
};

const ALLOWED = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
];

type Props = {
    currentFolderId?: number | null;
    currentFolderSlug?: string | null;
    onUploaded?: (uploaded: MediaItem[]) => void;
    children?: React.ReactNode;
};

export function UploadMediaDialog({
    currentFolderId = null,
    currentFolderSlug = null,
    onUploaded,
    children,
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [files, setFiles] = React.useState<PickedFile[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const { success, error } = useAppToast();

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        const target = e.target;
        if (!target || !target.files) return;

        setFiles((prev) => {
            const prevKeys = new Set(prev.map(f => `${f.file.name}_${f.file.size}`));

            const next: PickedFile[] = [];
            for (let i = 0; i < target.files.length; i++) {
                const f = target.files[i];
                const key = `${f.name}_${f.size}`;

                if (prevKeys.has(key)) continue;

                const okType = ALLOWED.includes(f.type);
                const okSize = f.size <= 20 * 1024 * 1024;
                const err = okType && okSize
                    ? undefined
                    : !okType
                        ? 'Định dạng không hỗ trợ'
                        : 'Kích thước vượt 20MB';

                next.push({ file: f, url: URL.createObjectURL(f), error: err });
            }

            // File mới luôn đứng trước
            return [...next, ...prev];
        });

        // reset input để onChange vẫn chạy nếu chọn lại đúng file đó
        target.value = '';
    }

    function removeAt(idx: number) {
        setFiles((prev) => {
            const f = prev[idx];
            if (f?.url) URL.revokeObjectURL(f.url);
            return prev.filter((_, i) => i !== idx);
        });
    }

    // Dọn các objectURL khi đóng dialog / unmount
    React.useEffect(() => {
        return () => {
            files.forEach((f) => f.url && URL.revokeObjectURL(f.url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onUpload() {
        if (!files.length) return;
        const valid = files.filter((f) => !f.error);
        if (!valid.length) { error('Không có file hợp lệ'); return; }

        setUploading(true);
        try {
            const opts: { folder_id?: number | null; folder_slug?: string | null } = {};
            if (currentFolderId !== undefined && currentFolderId !== null) opts.folder_id = currentFolderId;
            if (currentFolderSlug && currentFolderSlug.length) opts.folder_slug = currentFolderSlug;

            const uploaded = await apiUpload(valid.map(v => v.file), opts);

            // ✅ Thông báo cho parent tự refetch/mutate
            if (uploaded.length) onUploaded?.(uploaded);

            success('Upload thành công', `${valid.length} file đã được tải lên.`);
            setOpen(false);
            files.forEach((f) => f.url && URL.revokeObjectURL(f.url));
            setFiles([]);
        } catch (e: any) {
            error('Upload thất bại', e?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }
    function onWheelToHorizontal(e: React.WheelEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
            e.preventDefault();
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                    // thu hồi URL khi đóng
                    files.forEach((f) => f.url && URL.revokeObjectURL(f.url));
                    setFiles([]);
                }
            }}
        >
            <DialogTrigger asChild>
                {children ?? (
                    <Button size="sm" variant="outline">
                        <IconPlus />
                        Upload Media
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="w-[min(92vw,720px)] sm:w-[min(92vw,720px)] max-h-[85vh] p-0 overflow-hidden">
                {/* Header */}
                <div className="border-b p-6">
                    <DialogHeader>
                        <DialogTitle>Upload Media</DialogTitle>
                        <DialogDescription>
                            Hỗ trợ{' '}
                            {ALLOWED.map((m) => (
                                <Badge key={m} variant="secondary" className="mr-1">
                                    {m.split('/')[1]}
                                </Badge>
                            ))}
                            <span className="ml-2 text-xs text-muted-foreground">(tối đa 20MB mỗi file)</span>
                        </DialogDescription>
                    </DialogHeader>

                    <label className="mt-4 flex h-28 cursor-pointer items-center justify-center rounded-md border border-dashed text-sm hover:bg-muted/40">
                        <input type="file" multiple accept={ALLOWED.join(',')} className="hidden" onChange={onPick} />
                        <span>Chọn file (nhiều file được)</span>
                    </label>
                </div>

                {/* Body */}
                <div className="h-56 px-6 py-2 overflow-y-auto">
                    {files.length > 0 ? (
                        <div
                            className="max-w-full w-full overflow-x-auto overflow-y-hidden rounded-md border p-2"
                            onWheel={onWheelToHorizontal}
                        >
                            <div className="flex w-max flex-nowrap gap-3 snap-x snap-mandatory">
                                {files.map((f, idx) => (
                                    <div
                                        key={idx}
                                        className="snap-start w-56 flex-none relative overflow-hidden rounded-md border p-2 bg-background"
                                    >
                                        {String(f.file.type).startsWith('image/') ? (
                                            <img
                                                src={f.url}
                                                alt={f.file.name}
                                                className="h-28 w-full rounded object-cover"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = '/thumb-default.jpeg';
                                                }}
                                            />
                                        ) : (
                                            <video className="h-28 w-full rounded object-cover" src={f.url} muted />
                                        )}

                                        <div className="mt-2 truncate text-xs">{f.file.name}</div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{(f.file.size / 1024).toFixed(1)} KB</span>
                                            <span>{f.file.type}</span>
                                        </div>

                                        {f.error ? <div className="mt-1 text-xs text-red-600">{f.error}</div> : null}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1 h-7 px-2 text-xs"
                                            onClick={() => removeAt(idx)}
                                            disabled={uploading}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto border-t py-2">
                    <div className="ps-6 text-xs text-muted-foreground">Đã chọn: {files.length} file</div>
                    <div className="border-t p-6 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button onClick={onUpload} disabled={uploading || files.length === 0}>
                            {uploading ? 'Uploading…' : 'Upload'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}