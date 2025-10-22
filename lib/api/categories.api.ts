import { http } from "../http";

export async function apiFetchTags(q: string,) {
    const url = `/article/tags/search?q=${encodeURIComponent(q)}`;

    try {
        const data = await http.get<any[]>(url, {
        });
        return data ?? [];
    } catch (error) {
        throw new Error(`apiFetchTags error: ${error.message}`);
    }
}