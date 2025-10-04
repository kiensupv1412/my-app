// hooks/use-upload-file.ts
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

export type UploadedFile<T = unknown> = {
    name: string; size: number; type: string; url: string; appUrl?: string;
} & (T extends object ? T : Record<string, never>);

type UploadFilesOptionsCompat = {
    headers?: Record<string, string>;
    onUploadBegin?: (file: File) => void;
    onUploadProgress?: (args: { progress: number }) => void;
    skipPolling?: boolean;
};

interface UseUploadFileProps extends Pick<
    UploadFilesOptionsCompat,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
> {
    endpoint?: string;             // default: '/upload_media'
    folder_id?: number | string | null;
    onUploadComplete?: (file: UploadedFile) => void;
    onUploadError?: (error: unknown) => void;
    autoResetMs?: number | null;   // mới: tự reset sau X ms; null = không reset
}

export function useUploadFile({
    endpoint = 'http://localhost:4000/upload_media',
    folder_id,
    onUploadComplete,
    onUploadError,
    autoResetMs = 800, // ← mặc định reset chậm
    ...props
}: UseUploadFileProps = {}) {
    const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
    const [uploadingFile, setUploadingFile] = React.useState<File>();
    const [progress, setProgress] = React.useState<number>(0);
    const [isUploading, setIsUploading] = React.useState(false);

    const setPct = React.useCallback((n: number) => {
        const v = Math.max(0, Math.min(100, Math.round(n)));
        setProgress(v);
        props.onUploadProgress?.({ progress: v });
    }, [props]);

    async function uploadFile(file: File): Promise<UploadedFile> {
        setIsUploading(true);
        setUploadingFile(file);
        setPct(0);
        props.onUploadBegin?.(file);

        try {
            const form = new FormData();
            form.append('file', file);
            if (folder_id != null) form.append('folder_id', String(folder_id));

            const uploaded = await new Promise<UploadedFile>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint);

                // ĐỪNG set 'Content-Type' cho FormData
                if (props.headers) {
                    for (const [k, v] of Object.entries(props.headers)) {
                        if (k.toLowerCase() === 'content-type') continue; // chặn
                        xhr.setRequestHeader(k, v);
                    }
                }

                // === DEBUG events (bật khi cần) ===
                // xhr.upload.onloadstart = () => console.log('[upload] loadstart');
                // xhr.upload.onabort     = () => console.log('[upload] abort');
                // xhr.upload.onerror     = (e) => console.log('[upload] error', e);
                // xhr.upload.onloadend   = () => console.log('[upload] loadend');

                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable && evt.total > 0) {
                        setPct((evt.loaded / evt.total) * 100);
                    } else {
                        // Không tính được tổng → cứ nhích nhẹ để UI thấy đang chạy
                        setPct((p) => (p < 95 ? p + 1 : p));
                    }
                };

                // Khi server trả về xong → ép 100
                xhr.onload = () => {
                    try {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setPct(100);
                            const json = JSON.parse(xhr.responseText || '{}');
                            const data: any = json.data ?? json; // chấp nhận cả {data:...} lẫn {...}
                            resolve(data as UploadedFile);
                        } else {
                            reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
                        }
                    } catch (e) { reject(e); }
                };

                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(form);
            });

            setUploadedFile(uploaded);
            onUploadComplete?.(uploaded);
            return uploaded;
        } catch (error) {
            const msg = getErrorMessage(error);
            toast.error(msg || 'Something went wrong, please try again later.');
            onUploadError?.(error);

            // Mock fallback (giữ UX)
            const mock: UploadedFile = {
                appUrl: `https://mock-app-url.com/${file.name}`,
                name: file.name, size: file.size, type: file.type,
                url: URL.createObjectURL(file)
            };

            // Animate tới 100 cho đẹp
            for (let p = progress; p < 100; p += 2) {
                await new Promise(r => setTimeout(r, 16));
                setPct(p + 2);
            }
            setUploadedFile(mock);
            return mock;
        } finally {
            // KHÔNG reset ngay → UI còn thấy 100% 1 lúc
            if (autoResetMs != null) {
                setTimeout(() => {
                    setProgress(0);
                    setIsUploading(false);
                    setUploadingFile(undefined);
                }, autoResetMs);
            } else {
                setIsUploading(false);
                setUploadingFile(undefined);
            }
        }
    }

    return { isUploading, progress, uploadedFile, uploadFile, uploadingFile };
}

export function getErrorMessage(err: unknown) {
    const unknownError = 'Something went wrong, please try again later.';
    if (err instanceof z.ZodError) return err.issues.map(i => i.message).join('\n');
    if (err instanceof Error) return err.message;
    return unknownError;
}
export function showErrorToast(err: unknown) {
    return toast.error(getErrorMessage(err));
}
