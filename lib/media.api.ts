// path: /lib/media.api.ts

/* ============
 * Types
 * ============ */
export type MediaItem = {
  id: number;
  site?: number;
  user_id?: number;
  media_type?: string;
  uuid?: string;
  name: string;
  file_name: string;
  file_url: string;             // tuyệt đối sau normalize
  file_size?: number | null;
  mime: string;
  alt?: string | null;
  caption?: string | null;
  thumbnail?: string | null;    // absolutize nếu là path tương đối
  width?: number | null;
  height?: number | null;
  created_at?: any;
  updated_at?: any;
};

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
    (m && m.url)      ? String(m.url)      : '';

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
      (m && m.size      !== undefined) ? Number(m.size)      : 0,
    mime: (m && m.mime) ? String(m.mime) : 'application/octet-stream',
    alt: (m && m.alt !== undefined && m.alt !== null) ? String(m.alt) : null,
    caption: (m && m.caption !== undefined && m.caption !== null) ? String(m.caption) : null,
    thumbnail: rawThumb ? absolutizeUrl(rawThumb) : null,
    width:  (m && m.width  !== undefined) ? Number(m.width)  : null,
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
      rows: rows.map(normalizeMediaItem).filter(x => x && x.id && x.file_url)
    }
  }

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
  return raw.map((x) => normalizeMediaItem(x)).filter((x) => x && x.id && x.file_url);
}

/** Convenience wrapper: lấy media theo folder_id (null = root) */
export async function apiListMediaByFolder(folderId: number | null) {
  return apiListMedia({ folder_id: (folderId === null ? 'null' : folderId) })
}