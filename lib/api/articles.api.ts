/*
 * path: lib/api/articles.api.ts
 */
import { http } from "../http";
export async function createArticle(newItem: any, token: string | null) {
    // gọi core http
    const created = await http.post<any>('/article', newItem, { token });
    return created;
}

export async function updateArticle(id: string | number, patch: any, token: string | null) {
    const serverData = await http.put<any>(`/article/update/${id}`, patch, { token });
    return serverData;
}