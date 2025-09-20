// path: /lib/media.api.ts

export type FolderItem = {
  id: number;
  name: string;
  slug: string;
  site: number;
  created_at?: any;
  updated_at?: any;
};

export type ListMediaResp = { page: number; pageSize: number; total: number; rows: any[] };
export type Folder = { id: number; name: string; slug?: string | null; cover_url?: string | null; total?: number };

/* ============
 * URL helpers
 * ============ */
function apiBase(): string {
  let api = process.env.NEXT_PUBLIC_API_URL
    ? String(process.env.NEXT_PUBLIC_API_URL)
    : 'http://localhost:4000';
  while (api.endsWith('/')) api = api.slice(0, -1);
  return api;
}

// Nếu có CDN thì cấu hình NEXT_PUBLIC_ASSET_BASE, mặc định dùng API base
function assetBase(): string {
  let base =
    process.env.NEXT_PUBLIC_ASSET_BASE && String(process.env.NEXT_PUBLIC_ASSET_BASE).trim().length
      ? String(process.env.NEXT_PUBLIC_ASSET_BASE)
      : apiBase();
  while (base.endsWith('/')) base = base.slice(0, -1);
  return base;
}

function absolutizeUrl(u?: string | null): string {
  const s = (u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = assetBase();
  return s.startsWith('/') ? base + s : base + '/' + s;
}

/* ============
 * Normalizers
 * ============ */
export function normalizeMediaItem(m: any): MediaItem {
  const rawFileUrl =
    (m && m.file_url) ? String(m.file_url) :
      (m && m.url) ? String(m.url) : '';

  const rawThumb =
    (m && m.thumbnail !== undefined && m.thumbnail !== null) ? String(m.thumbnail) : null;

  return {
    id: Number(m && m.id ? m.id : 0),
    site: (m && m.site !== undefined) ? m.site : undefined,
    user_id: (m && m.user_id !== undefined) ? m.user_id : undefined,
    media_type: (m && m.media_type) ? String(m.media_type) : undefined,
    uuid: (m && m.uuid) ? String(m.uuid) : undefined,
    name:
      (m && m.name) ? String(m.name) :
        (m && m.original_name) ? String(m.original_name) :
          (m && m.file_name) ? String(m.file_name) : 'Untitled',
    file_name:
      (m && m.file_name) ? String(m.file_name) :
        (m && m.stored_name) ? String(m.stored_name) : '',
    file_url: absolutizeUrl(rawFileUrl),
    file_size:
      (m && m.file_size !== undefined) ? Number(m.file_size) :
        (m && m.size !== undefined) ? Number(m.size) : 0,
    mime: (m && m.mime) ? String(m.mime) : 'application/octet-stream',
    alt: (m && m.alt !== undefined && m.alt !== null) ? String(m.alt) : null,
    caption: (m && m.caption !== undefined && m.caption !== null) ? String(m.caption) : null,
    thumbnail: rawThumb ? absolutizeUrl(rawThumb) : null,
    width: (m && m.width !== undefined) ? Number(m.width) : null,
    height: (m && m.height !== undefined) ? Number(m.height) : null,
    created_at: m && m.created_at ? m.created_at : undefined,
    updated_at: m && m.updated_at ? m.updated_at : undefined,
  };
}

function extractItemsFromPayload(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  if (payload && Array.isArray(payload.inserted)) return payload.inserted;
  if (payload && payload.id !== undefined) return [payload];
  return [];
}

/* ============
 * Fetch helpers
 * ============ */
async function parseJsonOrText(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

function qs(params: Record<string, string | number | null | undefined>) {
  const parts: string[] = [];
  for (const k in params) {
    const v = params[k];
    if (v === undefined || v === null) continue;
    parts.push(encodeURIComponent(String(k)) + '=' + encodeURIComponent(String(v)));
  }
  return parts.length ? '?' + parts.join('&') : '';
}

/* ===========================
   FOLDERS
   =========================== */
export async function apiListFolders(): Promise<FolderItem[]> {
  const url = apiBase() + '/folders';
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  const payload = await parseJsonOrText(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : (payload && (payload as any).error) || 'Folder list failed';
    throw new Error(String(msg));
  }
  return (Array.isArray(payload) ? payload : []) as FolderItem[];
}

export async function apiCreateFolder(name: string, site: number): Promise<FolderItem> {
  const url = apiBase() + '/folders';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: String(name), site: Number(site) }),
  });
  const payload = await parseJsonOrText(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : (payload && (payload as any).error) || 'Create folder failed';
    throw new Error(String(msg));
  }
  return payload as FolderItem;
}

export async function apiDeleteFolder(id: number): Promise<{ ok: boolean; id: number }> {
  const url = apiBase() + '/folders/' + String(id);
  const res = await fetch(url, { method: 'DELETE' });
  const payload = await parseJsonOrText(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : (payload && (payload as any).error) || 'Delete folder failed';
    throw new Error(String(msg));
  }
  return payload as { ok: boolean; id: number };
}

/* ===========================
   MEDIA
   =========================== */
export async function apiListMedia(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  // CHO PHÉP 'null' string để server hiểu IS NULL
  folder_id?: number | null | 'null';
}): Promise<{ page: number; pageSize: number; total: number; rows: MediaItem[] }> {
  const base = apiBase() + '/media';
  const url = base + qs({
    page: params.page !== undefined ? Number(params.page) : undefined,
    pageSize: params.pageSize !== undefined ? Number(params.pageSize) : undefined,
    q: params.q !== undefined ? String(params.q) : undefined,
    folder_id:
      params.folder_id === null ? 'null'
        : (typeof params.folder_id === 'string' ? params.folder_id
          : (typeof params.folder_id === 'number' ? params.folder_id : undefined)),
  })
  const res = await fetch(url, { method: 'GET', cache: 'no-store' })
  const payload = await parseJsonOrText(res)
  if (!res.ok) {
    const msg = typeof payload === 'string' ? payload : (payload && (payload as any).error ? String((payload as any).error) : 'List media failed')
    throw new Error(msg)
  }
  const json = payload as ListMediaResp
  const rows = Array.isArray(json.rows) ? json.rows : []
  return {
    page: Number(json.page || 1),
    pageSize: Number(json.pageSize || rows.length || 0),
    total: Number(json.total || rows.length || 0),
    rows: rows
      .map(normalizeMediaItem)
      .filter(x => Number.isFinite(x.id) && !!(x.file_url && x.file_url.trim().length))
  }
}
// path: /lib/media.api.ts

export async function apiDeleteMedia(id: number): Promise<{ mess?: string; ok?: boolean; id: number }> {
  const url = apiBase() + '/media/' + String(id);
  const res = await fetch(url, { method: 'DELETE' });
  const payload = await parseJsonOrText(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : (payload && (payload as any).error) || 'Delete media failed';
    throw new Error(String(msg));
  }
  return payload as { mess?: string; ok?: boolean; id: number };
}

/** Upload 1 hoặc nhiều file. Có thể truyền folder_id hoặc folder_slug */
export async function apiUpload(
  files: File[],
  opts?: { folder_id?: number | null; folder_slug?: string | null },
): Promise<MediaItem[]> {
  if (!(files && files.length)) return [];

  let url = apiBase() + (files.length === 1 ? '/media/upload' : '/media/uploads');
  const query: Record<string, string | number> = {};
  if (opts?.folder_id !== undefined && opts.folder_id !== null) query.folder_id = Number(opts.folder_id);
  if (opts?.folder_slug !== undefined && opts.folder_slug !== null && String(opts.folder_slug).length)
    query.folder_slug = String(opts.folder_slug);
  const qstr = qs(query);
  if (qstr) url += qstr;

  const fd = new FormData();
  if (files.length === 1) fd.append('file', files[0]);
  else files.forEach((f) => fd.append('files', f));

  const res = await fetch(url, { method: 'POST', body: fd });
  const payload = await parseJsonOrText(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : (payload && (payload as any).error) || 'Upload failed';
    throw new Error(String(msg));
  }

  const raw = extractItemsFromPayload(payload);
  return raw.map(normalizeMediaItem)
    .filter(x => Number.isFinite(x.id) && !!(x.file_url && x.file_url.trim().length))
}

/** Convenience wrapper: lấy media theo folder_id (null = root) */
export async function apiListMediaByFolder(folderId: number | null) {
  return apiListMedia({ folder_id: (folderId === null ? 'null' : folderId) })
}

import { MediaItem } from '@/types';
// ===========================
// SWR hooks + optimistic helpers
// ===========================
import useSWR, { mutate as swrMutate, SWRConfiguration } from 'swr'

// ---- SWR Keys (ổn định & có type) ----
export const swrKeys = {
  folders: () => ['folders'] as const,
  media: (p: { page: number; pageSize: number; folder_id?: number | null }) =>
    ['media', { page: p.page, pageSize: p.pageSize, folder_id: p.folder_id ?? null }] as const,
}

// ---- Hooks dùng SWR (giống style useArticles của bạn) ----
export function useFolders(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.folders(),
    apiListFolders,
    { revalidateOnFocus: false, ...config }
  )
  return {
    folders: (data ?? []) as FolderItem[],
    error,
    isLoading,
    refetch: mutate,
  }
}

/**
 * Lấy danh sách media theo trang + folder.
 * - keepPreviousData: giữ data cũ khi đổi page để UI không giật
 */
// lib/media.api.ts
export function useMediaList(
  params: { page: number; pageSize: number; folder_id?: number | null },
  config?: SWRConfiguration
) {
  const qFolder =
    params.folder_id === null
      ? 'null'
      : params.folder_id !== undefined
        ? String(params.folder_id)
        : 'null'; // ✅ mặc định root

  const key = `/media?page=${params.page}&pageSize=${params.pageSize}&folder_id=${qFolder}`;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => apiListMedia({ ...params, folder_id: qFolder === 'null' ? null : Number(qFolder) }),
    { revalidateOnFocus: false, keepPreviousData: true, ...config }
  );

  return {
    resp: data,
    media: (data?.rows ?? []) as MediaItem[],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? params.page),
    pageSize: Number(data?.pageSize ?? params.pageSize),
    error,
    isLoading,
    refetch: mutate,
    mutate,
  };
}

// ---------------------------
// Optimistic helpers
// ---------------------------

/**
 * Xoá media kiểu optimistic, KHÔNG cần refetch toàn trang.
 * - Tự giảm total và loại item ra khỏi rows trong cache của trang hiện tại.
 * - Vẫn gọi API thật sự; nếu lỗi sẽ rollback.
 */
export async function deleteMediaOptimistic(
  id: number,
  params: { page: number; pageSize: number; folder_id?: number | null }
) {
  const key = swrKeys.media(params)
  await swrMutate(
    key,
    async (current: { page: number; pageSize: number; total: number; rows: MediaItem[] } | undefined) => {
      const prev = current ?? { page: params.page, pageSize: params.pageSize, total: 0, rows: [] }
      const nextRows = prev.rows.filter((x) => x.id !== id)
      // gọi API
      try {
        await apiDeleteMedia(id)
        return {
          ...prev,
          rows: nextRows,
          total: Math.max(0, (prev.total ?? nextRows.length) - 1),
        }
      } catch (e) {
        // rollback (trả về prev)
        return prev
      }
    },
    { revalidate: false }
  )
}

/**
 * Tạo folder kiểu optimistic đơn giản:
 * - Thêm folder mới vào cache folders.
 * - Gọi API thật; nếu lỗi -> rollback.
 */
export async function createFolderOptimistic(name: string, site: number = 1) {
  const k = swrKeys.folders()
  await swrMutate(
    k,
    async (current: FolderItem[] | undefined) => {
      const prev = current ?? []
      const optimistic: FolderItem = {
        id: -(Date.now()), // id âm tạm
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        site,
      }
      // gọi API
      try {
        const created = await apiCreateFolder(name, site)
        return [created, ...prev] // thay vì optimistic
      } catch (e) {
        return prev // rollback
      }
    },
    { revalidate: false }
  )
}

/**
 * Sau khi upload xong, chỉ cần gọi hàm này để refetch cache trang hiện tại.
 */
export function refetchMediaList(params: { page: number; pageSize: number; folder_id?: number | null }) {
  return swrMutate(swrKeys.media(params))
}

/**
 * Nếu bạn muốn refetch folders sau khi tạo/xoá folder:
 */
export function refetchFolders() {
  return swrMutate(swrKeys.folders())
}
