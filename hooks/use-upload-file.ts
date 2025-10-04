// path: hooks/use-upload-file.ts
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

// ====== Types giữ giống tên cũ ======
export type UploadedFile<T = unknown> = {
    key: string;
    name: string;
    size: number;
    type: string;
    url: string;         // public URL từ server
    appUrl?: string;     // optional: nếu bạn muốn giữ tương thích với mock cũ
    // T có thể dùng để attach metadata riêng
} & (T extends object ? T : Record<string, never>);

// Bản tối thiểu tương thích chữ ký props cũ
type UploadFilesOptionsCompat = {
    headers?: Record<string, string>;
    onUploadBegin?: (file: File) => void;
    onUploadProgress?: (args: { progress: number }) => void;
    skipPolling?: boolean; // không dùng, chỉ để tương thích
};

// ====== Props giống file cũ + endpoint riêng ======
interface UseUploadFileProps extends Pick<
    UploadFilesOptionsCompat,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
> {
    endpoint?: string; // <<<< thêm: mặc định '/upload_media'
    folder_id?: number | string | null;
    onUploadComplete?: (file: UploadedFile) => void;
    onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
    endpoint = 'http://localhost:4000/upload_media',
    folder_id,
    onUploadComplete,
    onUploadError,
    ...props
}: UseUploadFileProps = {}) {
    const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
    const [uploadingFile, setUploadingFile] = React.useState<File>();
    const [progress, setProgress] = React.useState<number>(0);
    const [isUploading, setIsUploading] = React.useState(false);

    async function uploadThing(file: File): Promise<UploadedFile> {
        setIsUploading(true);
        setUploadingFile(file);
        props.onUploadBegin?.(file);

        try {
            // ---- Upload qua XHR để có upload.onprogress ----
            const form = new FormData();
            form.append('file', file);
            if (folder_id != null) form.append('folder_id', String(folder_id));

            const uploaded = await new Promise<UploadedFile>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', endpoint);

                if (props.headers) {
                    for (const [k, v] of Object.entries(props.headers)) {
                        xhr.setRequestHeader(k, v);
                    }
                }

                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        const pct = Math.round((evt.loaded / evt.total) * 100);
                        setProgress(Math.min(pct, 100));
                        props.onUploadProgress?.({ progress: Math.min(pct, 100) });
                    }
                };

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        try {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                const json = JSON.parse(xhr.responseText);
                                // server Express nên trả { data: { key,name,size,type,url } }
                                resolve(json.data as UploadedFile);
                            } else {
                                reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    }
                };

                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(form);
            });

            setUploadedFile(uploaded);
            onUploadComplete?.(uploaded);

            // trả về y như res[0] ở UploadThing
            return uploaded;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage.length ? errorMessage : 'Something went wrong, please try again later.');
            onUploadError?.(error);

            // --- Mock (y hệt file cũ) để không vỡ flow khi server down ---
            const mockUploadedFile: UploadedFile = {
                key: 'mock-key-0',
                appUrl: `https://mock-app-url.com/${file.name}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
            };

            // Simulate upload progress mượt như cũ
            let pct = 0;
            while (pct < 100) {
                await new Promise((r) => setTimeout(r, 50));
                pct += 2;
                setProgress(Math.min(pct, 100));
                props.onUploadProgress?.({ progress: Math.min(pct, 100) });
            }

            setUploadedFile(mockUploadedFile);
            return mockUploadedFile;
        } finally {
            setProgress(0);
            setIsUploading(false);
            setUploadingFile(undefined);
        }
    }

    // ====== 5 giá trị giống hệt hàm gốc ======
    return {
        isUploading,
        progress,
        uploadedFile,
        uploadFile: uploadThing,
        uploadingFile,
    };
}

// ====== Giữ nguyên helpers và chữ ký lỗi như file cũ ======
export function getErrorMessage(err: unknown) {
    const unknownError = 'Something went wrong, please try again later.';

    if (err instanceof z.ZodError) {
        const errors = err.issues.map((issue) => issue.message);
        return errors.join('\n');
    } else if (err instanceof Error) {
        return err.message;
    } else {
        return unknownError;
    }
}

export function showErrorToast(err: unknown) {
    const errorMessage = getErrorMessage(err);
    return toast.error(errorMessage);
}