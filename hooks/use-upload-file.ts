// hooks/use-upload-file.ts
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

export type UploadedFile<Extra extends object = Record<string, never>> = {
    name: string;
    size: number;
    type: string;
    url: string;
    appUrl?: string;
} & Extra;

type UploadFilesOptionsCompat = {
    headers?: Record<string, string>;
    onUploadBegin?: (file: File) => void;
    onUploadProgress?: (args: { progress: number }) => void;
    skipPolling?: boolean;
};

interface UseUploadFileProps<Extra extends object = Record<string, never>>
    extends Pick<
        UploadFilesOptionsCompat,
        'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
    > {
    endpoint?: string;            // default: '/upload_media'
    folder_id?: number | string | null;
    onUploadComplete?: (file: UploadedFile<Extra>) => void;
    onUploadError?: (error: unknown) => void;
    autoResetMs?: number | null;  // null = không reset tự động
}

type PctArg = number | ((prev: number) => number);

export function useUploadFile<Extra extends object = Record<string, never>>({
    endpoint = 'http://localhost:4000/upload_media',
    folder_id,
    onUploadComplete,
    onUploadError,
    autoResetMs = 800,
    ...props
}: UseUploadFileProps<Extra> = {}) {
    const [uploadedFile, setUploadedFile] = React.useState<UploadedFile<Extra>>();
    const [uploadingFile, setUploadingFile] = React.useState<File>();
    const [progress, setProgress] = React.useState<number>(0);
    const [isUploading, setIsUploading] = React.useState(false);

    const setPct = React.useCallback(
        (arg: PctArg) => {
            setProgress(prev => {
                const next = typeof arg === 'function' ? (arg as (p: number) => number)(prev) : arg;
                const v = Math.max(0, Math.min(100, Math.round(next)));
                props.onUploadProgress?.({ progress: v });
                return v;
            });
        },
        [props]
    );

    async function uploadFile(file: File): Promise<UploadedFile<Extra>> {
        setIsUploading(true);
        setUploadingFile(file);
        setPct(0);
        props.onUploadBegin?.(file);

        try {
            const form = new FormData();
            form.append('file', file);
            if (folder_id != null) form.append('folder_id', String(folder_id));

            const uploaded = await new Promise<UploadedFile<Extra>>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint);

                // Không set 'Content-Type' cho FormData
                if (props.headers) {
                    for (const [k, v] of Object.entries(props.headers)) {
                        if (k.toLowerCase() === 'content-type') continue;
                        xhr.setRequestHeader(k, v);
                    }
                }

                xhr.upload.onprogress = (evt: ProgressEvent<EventTarget>) => {
                    if (evt.lengthComputable && evt.total > 0) {
                        setPct((evt.loaded / evt.total) * 100);
                    } else {
                        // không biết total -> nhích nhẹ
                        setPct(p => (p < 95 ? p + 1 : p));
                    }
                };

                xhr.onload = () => {
                    try {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setPct(100);
                            const json = JSON.parse(xhr.responseText || '{}');
                            const data = (json.data ?? json) as UploadedFile<Extra>;
                            resolve(data);
                        } else {
                            reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
                        }
                    } catch (e) {
                        reject(e);
                    }
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
            const mock = {
                appUrl: `https://mock-app-url.com/${file.name}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
            } as UploadedFile<Extra>;

            for (let p = progress; p < 100; p += 2) {
                await new Promise(r => setTimeout(r, 16));
                setPct(p + 2);
            }
            setUploadedFile(mock);
            return mock;
        } finally {
            // để 100% hiển thị một lúc trước khi reset
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
