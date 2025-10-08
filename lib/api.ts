// path: /lib/api.ts
import type { Folder, Folders, MediaItem, PaginationMeta } from "@/types";

// [CHANGE] chỉ import từ barrel /lib/http
import {
  apiBase,
  apiFetch,
  qs,
  AppError,
  // dùng cho XHR error mapping
  // (đã re-export từ lib/http/index.ts)
} from "@/lib/http";

// [KEEP] helper giữ nguyên vì là logic domain của /media uploads
function extractItemsFromPayload(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  if (payload && Array.isArray(payload.inserted)) return payload.inserted;
  if (payload && payload.id !== undefined) return [payload];
  return [];
}

/* ===========================
   FOLDERS
   =========================== */
export async function apiListFolders(): Promise<Folders> {
  const url = apiBase() + "/folders";
  const payload = await apiFetch<any>(url, { method: "GET", cache: "no-store" });
  return (Array.isArray(payload) ? payload : []) as Folders;
}

export async function apiCreateFolder(name: string, site: number): Promise<Folder> {
  const url = apiBase() + "/folders";
  const payload = await apiFetch<Folder>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: String(name), site: Number(site) }),
  });
  return payload as Folder;
}

export async function apiDeleteFolder(id: number): Promise<{ ok: boolean; id: number }> {
  const url = apiBase() + "/folders/" + String(id);
  const payload = await apiFetch<{ ok: boolean; id: number }>(url, { method: "DELETE" });
  return payload as { ok: boolean; id: number };
}

/* ===========================
   MEDIA
   =========================== */
export async function apiListMedia(params: {
  page?: number;
  limit?: number;
  folder_id?: number | null | "null";
}): Promise<{ data: MediaItem[]; meta: PaginationMeta }> {
  const base = apiBase() + "/media";
  const url =
    base +
    qs({
      page: params.page,
      limit: params.limit,
      folder_id:
        params.folder_id === null
          ? "null"
          : typeof params.folder_id === "string"
            ? params.folder_id
            : typeof params.folder_id === "number"
              ? params.folder_id
              : undefined,
    });

  const payload = await apiFetch<any>(url, { method: "GET", cache: "no-store" });

  return {
    data: Array.isArray(payload?.data) ? (payload.data as MediaItem[]) : [],
    meta:
      payload?.meta ?? {
        page: 1,
        limit: 10,
        pages: 1,
        total: 0,
        prev: null,
        next: null,
      },
  };
}

export async function apiDeleteMedia(
  id: number
): Promise<{ mess?: string; ok?: boolean; id: number }> {
  const url = apiBase() + "/media/" + String(id);
  const payload = await apiFetch<{ mess?: string; ok?: boolean; id: number }>(url, {
    method: "DELETE",
  });
  return payload as { mess?: string; ok?: boolean; id: number };
}

/** Upload 1 hoặc nhiều file. Có thể truyền folder_id hoặc folder_slug */
export async function apiUploadMedia(
  files: File[],
  opts?: {
    folder_id?: number | null;
    folder_slug?: string | null;
    is_background?: boolean | null;
    headers?: Record<string, string>;
    onProgress?: (pct: number, evt: ProgressEvent) => void;
  }
) {
  if (!files?.length) return [];

  const url = apiBase() + (files.length === 1 ? "/media/upload" : "/media/uploads");
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

  // XHR để có progress, map lỗi về AppError
  const items = await new Promise<any[]>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    if (opts?.headers) {
      for (const [k, v] of Object.entries(opts.headers)) {
        if (k.toLowerCase() === "content-type") continue; // FormData tự set
        xhr.setRequestHeader(k, v);
      }
    }

    xhr.upload.onprogress = (evt) => {
      if (opts?.onProgress) {
        if (evt.lengthComputable && evt.total > 0) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          opts.onProgress(Math.min(pct, 100), evt);
        } else {
          opts.onProgress(-1, evt);
        }
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
          // nuốt lỗi parse
        }

        if (!ok) {
          // [CHANGE] ném AppError đồng nhất (message đã chuẩn hoá ở server → nếu cần,
          // bạn có thể thêm normalizeErrorMessage/mapStatusToKind vào barrel và dùng ở đây)
          const msg =
            (typeof json === "string" && json) ||
            json?.message ||
            json?.error ||
            `HTTP ${xhr.status}`;
          const retryable = xhr.status === 429 || xhr.status === 503;
          return reject(new AppError(msg, xhr.status >= 500 ? "server" : "validation", {
            status: xhr.status,
            retryable,
            details: json
          }));
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
