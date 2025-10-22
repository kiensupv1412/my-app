// hooks/use-upload-file.ts
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import { API_BASE } from '@/lib/http/constants';

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
    /** Đường dẫn tương đối hoặc tuyệt đối. Mặc định relative, hook sẽ tự ghép BASE_URL */
    endpoint?: string; // default: '/media/upload'
    folder_id?: number | string | null;
    folder_slug?: string | null;
    is_background?: boolean | null;
    onUploadComplete?: (file: UploadedFile<Extra>) => void;
    onUploadError?: (error: unknown) => void;
    autoResetMs?: number | null; // null = không reset tự động
}

type PctArg = number | ((prev: number) => number);

export function useUploadFile<Extra extends object = Record<string, never>>({
    endpoint = '/media/upload',
    folder_id,
    folder_slug,
    is_background,
    onUploadComplete,
    onUploadError,
    autoResetMs = 800,
    ...props
}: UseUploadFileProps<Extra> = {}) {

    const [uploadedFile, setUploadedFile] = React.useState<UploadedFile<Extra>>();
    const [uploadingFile, setUploadingFile] = React.useState<File>();
    const [progress, setProgress] = React.useState<number>(0);
    const [isUploading, setIsUploading] = React.useState(false);

    // chuẩn hoá endpoint -> URL tuyệt đối (cần cho XHR)
    const absEndpoint = React.useMemo(() => {
        const base = (API_BASE || '').replace(/\/+$/, '');
        if (/^https?:\/\//i.test(endpoint)) return endpoint; // đã tuyệt đối
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return base + path;
    }, [endpoint]);

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
            if (folder_slug) form.append('folder_slug', String(folder_slug).trim());
            if (typeof is_background === 'boolean') form.append('is_background', String(is_background));

            const uploaded = await new Promise<UploadedFile<Extra>>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', absEndpoint);

                const headers: Record<string, string> = { ...(props.headers ?? {}) };
                for (const [k, v] of Object.entries(headers)) {
                    if (k.toLowerCase() === 'content-type') continue; // FormData tự set
                    xhr.setRequestHeader(k, v);
                }

                xhr.upload.onprogress = (evt: ProgressEvent<EventTarget>) => {
                    if (evt.lengthComputable && evt.total > 0) {
                        setPct((evt.loaded / evt.total) * 100);
                    } else {
                        setPct(p => (p < 95 ? p + 1 : p)); // không có total -> nhích nhẹ
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
                            const msg =
                                (() => {
                                    try {
                                        const j = JSON.parse(xhr.responseText || '{}');
                                        return j?.message || j?.error;
                                    } catch {
                                        return undefined;
                                    }
                                })() || `HTTP ${xhr.status}`;
                            reject(new Error(msg));
                        }
                    } catch (e) {
                        reject(e);
                    }
                };

                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(form);
            });

            setUploadedFile(uploaded);
            console.log("🚀 ~ uploadFile ~ uploaded:", uploaded)
            onUploadComplete?.(uploaded);
            return uploaded;
        } catch (error) {
            const msg = getErrorMessage(error);
            toast.error(msg || 'Something went wrong, please try again later.');
            onUploadError?.(error);

            // Fallback mock để UI không "toang"
            const mock = {
                appUrl: `https://mock-app-url.com/${file.name}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
            } as UploadedFile<Extra>;

            for (let p = progress; p < 100; p += 2) {
                // mượt progress
                // eslint-disable-next-line no-await-in-loop
                await new Promise(r => setTimeout(r, 16));
                setPct(p + 2);
            }
            setUploadedFile(mock);
            return mock;
        } finally {
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