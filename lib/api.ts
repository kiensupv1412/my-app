// path: /lib/api.ts
import { Folder, Folders, MediaItem, PaginationMeta } from "@/types";

export type ListMediaResp = {
  page: number;
  pageSize: number;
  total: number;
  rows: any[];
};

/* ============
 * URL helpers
 * ============ */
function apiBase(): string {
  let api = process.env.NEXT_PUBLIC_API_URL
    ? String(process.env.NEXT_PUBLIC_API_URL)
    : "http://localhost:4000";
  while (api.endsWith("/")) api = api.slice(0, -1);
  return api;
}
function extractItemsFromPayload(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  if (payload && Array.isArray(payload.inserted)) return payload.inserted;
  if (payload && payload.id !== undefined) return [payload];
  return [];
}
function qs(params: Record<string, string | number | null | undefined>) {
  const parts: string[] = [];
  for (const k in params) {
    const v = params[k];
    if (v === undefined || v === null) continue;
    parts.push(
      encodeURIComponent(String(k)) + "=" + encodeURIComponent(String(v))
    );
  }
  return parts.length ? "?" + parts.join("&") : "";
}

/* ===========================
   FOLDERS
   =========================== */
export async function apiListFolders(): Promise<Folders[]> {
  const url = apiBase() + "/folders";
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const payload = await res.json();

  if (!res.ok) {
    const msg =
      typeof payload === "string"
        ? payload
        : (payload && (payload as any).error) || "Folder list failed";
    throw new Error(String(msg));
  }

  return (Array.isArray(payload) ? payload : []) as Folders[];
}
export async function apiCreateFolder(
  name: string,
  site: number
): Promise<Folder> {
  const url = apiBase() + "/folders";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: String(name), site: Number(site) }),
  });
  const payload = await res.json();
  if (!res.ok) {
    const msg =
      typeof payload === "string"
        ? payload
        : (payload && (payload as any).error) || "Create folder failed";
    throw new Error(String(msg));
  }
  return payload as Folder;
}
export async function apiDeleteFolder(
  id: number
): Promise<{ ok: boolean; id: number }> {
  const url = apiBase() + "/folders/" + String(id);
  const res = await fetch(url, { method: "DELETE" });
  const payload = await res.json();
  if (!res.ok) {
    const msg =
      typeof payload === "string"
        ? payload
        : (payload && (payload as any).error) || "Delete folder failed";
    throw new Error(String(msg));
  }
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

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  let payload: any;
  try {
    payload = await res.json();
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok) {
    const msg =
      typeof payload === "string"
        ? payload
        : payload?.error || "List media failed";
    throw new Error(String(msg));
  }

  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta || {
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
  const res = await fetch(url, { method: "DELETE" });
  const payload = await res.json();
  if (!res.ok) {
    const msg =
      typeof payload === "string"
        ? payload
        : (payload && (payload as any).error) || "Delete media failed";
    throw new Error(String(msg));
  }
  return payload as { mess?: string; ok?: boolean; id: number };
}
/** Upload 1 hoặc nhiều file. Có thể truyền folder_id hoặc folder_slug */
export async function apiUploadMedia(
  files: File[],
  opts?: {
    folder_id?: number | null;
    folder_slug?: string | null;
    is_background?: boolean | null;
  }
): Promise<MediaItem[]> {
  if (!files?.length) return [];

  // 1 file → /media/upload ; nhiều file → /media/uploads
  const url =
    apiBase() + (files.length === 1 ? "/media/upload" : "/media/uploads");

  const fd = new FormData();

  // files
  if (files.length === 1) {
    fd.append("file", files[0]);
  } else {
    files.forEach((f) => fd.append("files", f));
  }

  if (Object.prototype.hasOwnProperty.call(opts ?? {}, "folder_id")) {
    const fid = opts?.folder_id;
    if (fid === null) {
      fd.append("folder_id", "null"); // ép root (IS NULL)
    } else if (typeof fid === "number" && Number.isFinite(fid)) {
      fd.append("folder_id", String(fid)); // folder cụ thể
    }
  }

  if (opts?.folder_slug && String(opts.folder_slug).trim().length > 0) {
    fd.append("folder_slug", String(opts.folder_slug).trim());
  }

  if (typeof opts?.is_background === "boolean") {
    fd.append("is_background", String(opts.is_background)); // "true" | "false"
  }

  const res = await fetch(url, { method: "POST", body: fd, cache: "no-store" });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    const msg =
      typeof payload === "string" ? payload : payload?.error || "Upload failed";
    throw new Error(String(msg));
  }

  const items = extractItemsFromPayload(payload);
  return items;
}
