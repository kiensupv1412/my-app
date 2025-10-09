import { MediaItem, PaginationMeta } from "@/types";
import { apiFetch, AppError } from "../http";
import { API_BASE } from "../http/constants";

/** Upload 1 hoặc nhiều file. Có thể truyền folder_id hoặc folder_slug.
 *  Dùng XHR để có onProgress => cần URL tuyệt đối (BASE_URL).
 *  Tự thêm Authorization nếu cung cấp token (trừ khi headers đã set sẵn).
 */
export async function apiUploadMedia(
    files: File[],
    opts?: {
        folder_id?: number | null;
        folder_slug?: string | null;
        is_background?: boolean | null;
        headers?: Record<string, string>;
        token?: string | null; // <- thêm token ở đây
        onProgress?: (pct: number, evt: ProgressEvent) => void;
    }
) {
    if (!files?.length) return [];

    const url = API_BASE + (files.length === 1 ? "/media/upload" : "/media/uploads");
    const fd = new FormData();

    if (files.length === 1) fd.append("file", files[0]);
    else files.forEach((f) => fd.append("files", f));

    if (Object.prototype.hasOwnProperty.call(opts ?? {}, "folder_id")) {
        const fid = opts?.folder_id;
        if (fid === null) fd.append("folder_id", "null");
        else if (typeof fid === "number" && Number.isFinite(fid)) fd.append("folder_id", String(fid));
    }
    if (opts?.folder_slug) fd.append("folder_slug", String(opts.folder_slug).trim());
    if (typeof opts?.is_background === "boolean")
        fd.append("is_background", String(opts.is_background));

    const items = await new Promise<any[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        // Ưu tiên headers từ opts; tự thêm Authorization nếu có token mà header chưa set
        const headers: Record<string, string> = { ...(opts?.headers ?? {}) };
        if (opts?.token && !headers["Authorization"]) {
            headers["Authorization"] = `Bearer ${opts.token}`;
        }
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
        xhr.send(fd);
    });

    return items;
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