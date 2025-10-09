export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export function joinBase(path: string) {
    let base = API_BASE?.replace(/\/+$/, "") || "";
    let p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
}