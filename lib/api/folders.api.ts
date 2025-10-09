/* =========================== FOLDERS ============================== */
// => Thêm tham số token? để pass Bearer khi cần.

import { Folder, Folders } from "@/types";
import { apiFetch } from "../http";

// => Dùng đường dẫn tương đối, apiFetch tự gắn base.
export async function apiListFolders(token?: string): Promise<Folders> {
    const payload = await apiFetch<any>("/folders", { method: "GET", cache: "no-store", token });
    return (Array.isArray(payload) ? payload : []) as Folders;
}

export async function apiCreateFolder(name: string, site: number, token?: string): Promise<Folder> {
    const payload = await apiFetch<Folder>("/folders", {
        method: "POST",
        token,
        json: { name: String(name), site: Number(site) },
    });
    return payload as Folder;
}

export async function apiDeleteFolder(id: number, token?: string): Promise<{ ok: boolean; id: number }> {
    const payload = await apiFetch<{ ok: boolean; id: number }>(`/folders/${String(id)}`, {
        method: "DELETE",
        token,
    });
    return payload as { ok: boolean; id: number };
}