/* =========================== FOLDERS ============================== */

import { Folder, Folders } from "@/types";
import { http } from "../http";

// => Dùng đường dẫn tương đối, http tự gắn base.
export async function apiListFolders(): Promise<Folders> {
    const payload = await http.get<any>("/folders", { cache: "no-store" });
    return (Array.isArray(payload) ? payload : []) as Folders;
}

export async function apiCreateFolder(name: string, site: number,): Promise<Folder> {
    const payload = await http.post<Folder>("/folders", {
        json: { name: String(name), site: Number(site) },
    });
    return payload as Folder;
}

export async function apiDeleteFolder(id: number,): Promise<{ ok: boolean; id: number }> {
    const payload = await http.delete<{ ok: boolean; id: number }>(`/folders/${String(id)}`, {
    });
    return payload as { ok: boolean; id: number };
}