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

import { apiUploadMedia } from '@/lib/api';
import { Checkbox } from '../ui/checkbox';
import { TinyProgress } from '../ui/tinyProgress';
import { useProgress } from '@/hooks/use-progress';
import { MediaItem } from '@/types';

type PickedFile = {
    file: File;
    url: string;
    error?: string;
    loaded?: number;         // bytes
    total?: number;          // bytes
    status?: 'idle' | 'uploading' | 'done' | 'error';
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
    const [isBackground, setIsBackground] = React.useState(false);
    const { success, error } = useAppToast();

    const { loaded, total, fromEvent, reset } = useProgress();
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const [itemIndex, setItemIndex] = React.useState(0);
    const [doneSet, setDoneSet] = React.useState<Set<number>>(new Set());

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

                next.push({
                    file: f,
                    url: URL.createObjectURL(f),
                    error: err,
                    loaded: 0,
                    total: 0,
                    status: 'idle'
                });
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
    }, []);

    async function onUpload() {
        const validIdx = files.map((f, i) => (!f.error ? i : -1)).filter(i => i >= 0);
        if (!validIdx.length) return error('Không có file hợp lệ');

        setUploading(true);

        // mark tất cả valid -> uploading
        setFiles(prev => prev.map((f, i) =>
            validIdx.includes(i) ? { ...f, status: 'uploading', loaded: 0, total: 0 } : f
        ));

        try {
            const promises = validIdx.map((i) =>
                apiUploadMedia([files[i].file], {
                    folder_id: currentFolderId ?? undefined,
                    folder_slug: currentFolderSlug ?? undefined,
                    is_background: isBackground,
                    onProgress: (_pct, evt) => {
                        if (evt && evt.lengthComputable && evt.total > 0) {
                            const { loaded, total } = evt;
                            setFiles(curr => {
                                const next = [...curr];
                                const it = next[i]; if (!it) return curr;
                                next[i] = {
                                    ...it,
                                    loaded: Math.max(it.loaded || 0, loaded),
                                    total: Math.max(it.total || 0, total)
                                };
                                return next;
                            });
                        }
                    }
                })
                    .then((res) => {
                        setFiles(curr => {
                            const next = [...curr]; const it = next[i]; if (!it) return curr;
                            // ép 100%
                            next[i] = { ...it, loaded: it.total || it.loaded || 0, status: 'done' };
                            return next;
                        });
                        return res;
                    })
                    .catch((e) => {
                        setFiles(curr => {
                            const next = [...curr]; const it = next[i]; if (!it) return curr;
                            next[i] = { ...it, status: 'error', error: e?.message || 'Upload failed' };
                            return next;
                        });
                    })
            );

            const results = await Promise.allSettled(promises);

            const okItems = results
                .filter(r => r.status === 'fulfilled')
                .flatMap((r: any) => r.value || []);
            if (okItems.length) onUploaded?.(okItems);

            // XONG HẾT -> đóng modal + dọn preview
            success('Upload hoàn tất');
            setOpen(false);
            files.forEach(f => f.url && URL.revokeObjectURL(f.url));
            setFiles([]);
        } catch (e: any) {
            error('Upload thất bại', e?.message);
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

    const totalValid = React.useMemo(() => files.filter(f => !f.error).length, [files]);
    const doneCount = React.useMemo(() => files.filter(f => !f.error && f.status === 'done').length, [files]);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                    files.forEach((f) => f.url && URL.revokeObjectURL(f.url));
                    setFiles([]);
                    setDoneSet(new Set());
                    reset();
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

            <DialogContent className="max-w-screen-lg max-h-[85vh] p-0 overflow-hidden">
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
                                {files.map((f, idx) => {
                                    const isImage = String(f.file.type).startsWith('image/');
                                    const pct = f.total && f.total > 0 ? Math.round(((f.loaded || 0) / f.total) * 100) : 0;
                                    const isUploadingItem = f.status === 'uploading';
                                    const isDone = f.status === 'done';
                                    const isError = f.status === 'error';

                                    const mediaCls = [
                                        'h-28 w-full rounded object-cover transition-opacity',
                                        isUploadingItem ? 'opacity-60' : 'opacity-100'
                                    ].join(' ');

                                    return (
                                        <div key={idx} className="snap-start w-56 flex-none relative overflow-hidden rounded-md border p-2 bg-background">
                                            {isImage
                                                ? <img src={f.url} alt={f.file.name} className={mediaCls}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/thumb-default.jpeg'; }} />
                                                : <video className={mediaCls} src={f.url} muted />
                                            }

                                            {isUploadingItem && (
                                                <div className="absolute inset-0 grid place-items-center bg-black/20">
                                                    <div className="relative">
                                                        <TinyProgress value={pct} />
                                                        <span className="absolute inset-0 grid place-items-center text-xs font-medium text-white">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-2 truncate text-xs">{f.file.name}</div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{(f.file.size / 1024).toFixed(1)} KB</span>
                                                <span>{f.file.type}</span>
                                            </div>

                                            {isError && <div className="mt-1 text-xs text-red-600">{f.error}</div>}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`absolute right-1 top-1 h-7 px-2 text-xs ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                onClick={() => removeAt(idx)}
                                                disabled={uploading}   // ✅ tắt ALL remove khi đang upload
                                            >
                                                Remove
                                            </Button>

                                            {isDone && (
                                                <span className="absolute left-1 top-1 rounded bg-emerald-600/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                    Done
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}


                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 mt-auto border-t py-2 px-6">
                    <div className="text-sm tabular-nums text-slate-600">
                        {uploading ? `${doneCount}/${totalValid}` : `0/${totalValid}`}
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">Đã chọn: {files.length} file</div>
                        <span className="text-sm">is_background</span>
                        <Checkbox checked={isBackground} onCheckedChange={(val) => setIsBackground(!!val)} disabled={uploading} />
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
                        <Button onClick={onUpload} disabled={uploading || files.length === 0}>
                            {uploading ? 'Uploading…' : 'Upload'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}