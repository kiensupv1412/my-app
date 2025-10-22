import { MediaItem, PaginationMeta } from "@/types";
import { AppError } from "../http";
import { API_BASE } from "../http/constants";
import { createFormData } from "../utils";
import { chain } from "lodash";


// Controller: media.controller.js

export async function apiUpdateMedia(id: number, updateData: Partial<MediaItem>) {

    // Gửi request PUT đến API để cập nhật media
    try {
        const response = await fetch(`/media/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.error || 'Error updating media');
        }

        const updatedMedia = await response.json();

        // Trả về dữ liệu đã được cập nhật từ server
        return updatedMedia;
    } catch (e) {
        console.error("[media.update] Error", e);
        throw e;
    }
}



/** Upload 1 hoặc nhiều file. Có thể truyền folder_id hoặc folder_slug.
 *  Dùng XHR để có onProgress => cần URL tuyệt đối (BASE_URL).
 */
export async function apiUploadMedia(
    file: File,
    opts?: {
        folder_id?: number | null;
        folder_slug?: string | null;
        is_background?: boolean | null;
        headers?: Record<string, string>;
        onProgress?: (pct: number, evt: ProgressEvent) => void;
    }
) {

    const fd = createFormData({
        file: file,
        folder_id: opts?.folder_id,
        is_background: opts?.is_background,
        folder_slug: opts?.folder_slug
    });

    const url = API_BASE + "/media/upload"; // Đảm bảo gửi tới đúng URL

    const item = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        const headers: Record<string, string> = { ...(opts?.headers ?? {}) };

        for (const [k, v] of Object.entries(headers)) {
            if (k.toLowerCase() === "content-type") continue; // FormData tự set
            xhr.setRequestHeader(k, v);
        }

        xhr.upload.onprogress = (evt) => {
            if (!opts?.onProgress) return;
            if (evt.lengthComputable && evt.total > 0) {
                const pct = Math.round((evt.loaded / evt.total) * 100);
                opts.onProgress(Math.min(pct, 100), evt);
            } else {
                opts.onProgress(-1, evt); // không tính được %
            }
        };

        xhr.onload = () => {
            try {
                const ok = xhr.status >= 200 && xhr.status < 300;
                const text = xhr.responseText;
                let json: any = undefined;
                try {
                    json = text ? JSON.parse(text) : undefined;
                } catch {
                    // ignore parse error
                }

                if (!ok) {
                    const msg =
                        (typeof json === "string" && json) ||
                        json?.message ||
                        json?.error ||
                        `HTTP ${xhr.status}`;
                    const retryable = xhr.status === 429 || xhr.status === 503;
                    return reject(
                        new AppError(
                            msg,
                            xhr.status >= 500 ? "server" : "validation",
                            { status: xhr.status, retryable, details: json }
                        )
                    );
                }

                resolve(extractItemsFromPayload(json ?? {}));
            } catch (e) {
                reject(new AppError("Upload failed", "unknown", { details: e }));
            }
        };

        xhr.onerror = () => reject(new AppError("Network error", "network", { retryable: true }));
        xhr.send(fd); // Gửi FormData chứa file
    });

    return item; // Trả về kết quả của upload file
}


/* ------------------------------------------------------------------ */
/* helper: bóc items từ payload (giữ nguyên logic cũ)                  */
/* ------------------------------------------------------------------ */
function extractItemsFromPayload(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.rows)) return payload.rows;
    if (payload && Array.isArray(payload.inserted)) return payload.inserted;
    if (payload && payload.id !== undefined) return [payload];
    return [];
}