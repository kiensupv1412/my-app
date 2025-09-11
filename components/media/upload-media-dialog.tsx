/*
 * path: components/media/upload-media-dialog.tsx
 */
'use client';

import { useAppToast } from '@/components/providers/app-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { apiUpload } from '@/lib/media.api';
import { IconPlus } from '@tabler/icons-react';
import * as React from 'react';

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

export function UploadMediaDialog(props: {
    setItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    currentFolderId?: number | null;     // thêm: để upload vào folder đang chọn
    currentFolderSlug?: string | null;   // nếu bạn muốn dùng slug thay id
}) {
    const setItems = props.setItems;
    const currentFolderId = typeof props.currentFolderId === 'number' ? props.currentFolderId : null;
    const currentFolderSlug = typeof props.currentFolderSlug === 'string' ? props.currentFolderSlug : null;

    const [open, setOpen] = React.useState(false);
    const [files, setFiles] = React.useState<PickedFile[]>([]);
    const [uploading, setUploading] = React.useState(false);
    const { success, error } = useAppToast();

    function onPick(e: React.ChangeEvent<HTMLInputElement>) {
        const target = e.target;
        if (!target || !target.files) return;

        const list: PickedFile[] = [];
        for (let i = 0; i < target.files.length; i++) {
            const f = target.files[i];
            const okType = ALLOWED.indexOf(f.type) !== -1;
            const okSize = f.size <= 20 * 1024 * 1024;
            const err = okType && okSize ? undefined : (!okType ? 'Định dạng không hỗ trợ' : 'Kích thước vượt 20MB');
            list.push({ file: f, url: URL.createObjectURL(f), error: err });
        }
        setFiles(list);
        target.value = '';
    }

    function removeAt(idx: number) {
        setFiles(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
    }

    async function onUpload() {
        if (!(files && files.length)) return;

        const valid = files.filter(function (f) { return !f.error; });
        if (!valid.length) {
            error('Không có file hợp lệ', 'Vui lòng chọn lại.');
            return;
        }

        setUploading(true);

        try {
            // gọi API client (tự build endpoint + form-data)
            var opts: { folder_id?: number | null; folder_slug?: string | null } = {};
            if (currentFolderId !== null) opts.folder_id = currentFolderId;
            if (currentFolderSlug && currentFolderSlug.length) opts.folder_slug = currentFolderSlug;

            const uploaded = await apiUpload(
                valid.map(function (v) { return v.file; }),
                opts
            );

            if (uploaded.length) {
                // prepend vào grid
                setItems(function (prev) { return uploaded.concat(prev); });
            }

            success('Upload thành công', String(valid.length) + ' file đã được tải lên.');
            setOpen(false);
            setFiles([]);
        } catch (e) {
            const msg = (e && (e as any).message) ? (e as any).message : 'Upload failed';
            console.error('[UPLOAD][EXCEPTION]', e);
            error('Upload thất bại', msg);
        } finally {
            setUploading(false);
        }
    }

    function onWheelToHorizontal(e: React.WheelEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        const canScrollX = el.scrollWidth > el.clientWidth;
        if (!canScrollX) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
            e.preventDefault();
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={function (v) {
                setOpen(v);
                if (!v) setFiles([]);
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <IconPlus />
                    Upload Media
                </Button>
            </DialogTrigger>

            <DialogContent className="w-[min(92vw,720px)] sm:w-[min(92vw,720px)] max-h-[85vh] p-0 overflow-hidden">
                <div className="p-6 border-b">
                    <DialogHeader>
                        <DialogTitle>Upload Media</DialogTitle>
                        <DialogDescription>
                            Hỗ trợ{' '}
                            {ALLOWED.map(function (m) {
                                return (
                                    <Badge key={m} variant="secondary" className="mr-1">
                                        {m.split('/')[1]}
                                    </Badge>
                                );
                            })}
                            <span className="ml-2 text-xs text-muted-foreground">(tối đa 20MB mỗi file)</span>
                        </DialogDescription>
                    </DialogHeader>

                    <label className="mt-4 flex h-28 cursor-pointer items-center justify-center rounded-md border border-dashed text-sm hover:bg-muted/40">
                        <input type="file" multiple accept={ALLOWED.join(',')} className="hidden" onChange={onPick} />
                        <span>Chọn file (nhiều file được)</span>
                    </label>
                </div>

                <div className="px-6 py-4 overflow-y-auto">
                    {files.length > 0 ? (
                        <div className="max-w-full w-full overflow-x-auto overflow-y-hidden rounded-md border p-2" onWheel={onWheelToHorizontal}>
                            <div className="flex w-max flex-nowrap gap-3 snap-x snap-mandatory">
                                {files.map(function (f, idx) {
                                    return (
                                        <div key={idx} className="snap-start w-56 flex-none relative overflow-hidden rounded-md border p-2 bg-background">
                                            {String(f.file.type).indexOf('image/') === 0 ? (
                                                <img
                                                    src={f.url}
                                                    alt={f.file.name}
                                                    className="h-28 w-full rounded object-cover"
                                                    onError={function (e) {
                                                        (e.currentTarget as HTMLImageElement).src = '/placeholder.png';
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
                                                onClick={function () { removeAt(idx); }}
                                                disabled={uploading}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="p-6 border-t flex justify-end gap-2">
                    <Button variant="outline" onClick={function () { setOpen(false); }} disabled={uploading}>
                        Cancel
                    </Button>
                    <Button onClick={onUpload} disabled={uploading || files.length === 0}>
                        {uploading ? 'Uploading…' : 'Upload'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}