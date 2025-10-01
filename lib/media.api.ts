// path: /lib/media.api.ts
import { MediaItem } from '@/types';
// import useSWR, { mutate as swrMutate, SWRConfiguration } from 'swr'

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
  const payload = await res.json();

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
  const payload = await res.json();
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
  const payload = await res.json();
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
  limit?: number;
  folder_id?: number | null | 'null';
}): Promise<{ data: MediaItem[]; meta: any }> {
  const url = apiBase() + '/media' + qs({
    page: params.page,
    limit: params.limit,
    folder_id:
      params.folder_id === null
        ? 'null'
        : typeof params.folder_id === 'string'
          ? params.folder_id
          : typeof params.folder_id === 'number'
            ? params.folder_id
            : undefined,
  });

  const res = await fetch(url, { cache: 'no-store' });
  let payload: any = null;

  try {
    payload = await res.json();
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : payload?.error || 'List media failed';
    throw new Error(msg);
  }

  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta || {},
  };
}
// path: /lib/media.api.ts

export async function apiDeleteMedia(id: number): Promise<{ mess?: string; ok?: boolean; id: number }> {
  const url = apiBase() + '/media/' + String(id);
  const res = await fetch(url, { method: 'DELETE' });
  const payload = await res.json();
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
  opts?: { folder_id?: number | null; folder_slug?: string | null; is_background?: boolean | null },
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
  fd.append('is_background', String(opts?.is_background));

  const res = await fetch(url, { method: 'POST', body: fd });
  const payload = await res.json();
  if (!res.ok) {
    const msg =
      typeof payload === 'string'
        ? payload
        : (payload && (payload as any).error) || 'Upload failed';
    throw new Error(String(msg));
  }

  const raw = extractItemsFromPayload(payload);
  return raw
}

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

/**
 * Nếu bạn muốn refetch folders sau khi tạo/xoá folder:
 */
export function refetchFolders() {
  return swrMutate(swrKeys.folders())
}
