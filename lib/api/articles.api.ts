/*
 * path: lib/api/articles.api.ts
 */
import { http } from "../http";
export async function createArticle(newItem: any,) {
    // gọi core http
    const created = await http.post<any>('/article', newItem);
    return created;
}

export async function updateArticle(id: string | number, patch: any,) {
    const serverData = await http.put<any>(`/article/update/${id}`, patch);
    return serverData;
}