// hooks/useArticles.ts
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';

const BASE_URL = "http://localhost:4000"

export function useArticles() {
    const { data, error, isLoading } = useSWR(BASE_URL + '/article', fetcher, { revalidateOnFocus: false });
    return { articles: data ?? [], error, isLoading };
}

export function useCategories() {
    const { data, error, isLoading } = useSWR(BASE_URL + '/article/categories', fetcher, { revalidateOnFocus: false });
    return { categories: data ?? [], error, isLoading };
}

// POST/PUT helpers có optimistic update
export async function createArticleOptimistic(newItem: any) {
    const key = BASE_URL + '/article';

    await mutate(key, async (current: any[] = []) => {
        // 1) Optimistic: thêm bản ghi tạm
        const tmpId = `tmp_${Date.now()}`;
        const optimistic = [{ ...newItem, id: tmpId, _optimistic: true }, ...current];

        // 2) Gọi API
        try {
            const res = await fetch(key, { method: 'POST', body: JSON.stringify(newItem), headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error('POST failed');
            const created = await res.json();

            // 3) Hợp nhất: thay bản ghi tạm bằng bản ghi thật
            return [created, ...current];
        } catch (e) {
            // rollback: trả lại current nếu lỗi
            return current;
        }
    }, { revalidate: false }); // không gọi lại API nữa (đã tự merge)
}

export async function updateArticleOptimistic(id: string, patch: any) {
    const listKey = BASE_URL + '/article';
    const detailKey = BASE_URL + `/article/update/${id}`;

    // Cập nhật list
    await mutate(listKey, async (current: any[] = []) => {
        const prev = current;
        const idx = prev.findIndex(x => String(x.id) === String(id));
        if (idx === -1) return prev;

        const updatedLocal = { ...prev[idx], ...patch };
        const optimistic = [...prev];
        optimistic[idx] = updatedLocal;

        // gọi API
        try {
            const res = await fetch(detailKey, {
                method: 'PUT',
                body: JSON.stringify(patch),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('PUT failed');
            const serverData = await res.json();
            const merged = [...prev];
            merged[idx] = serverData;
            // đồng bộ luôn cache detail (nếu trang chi tiết đang mở)
            mutate(detailKey, serverData, false);
            return merged;
        } catch (e) {
            return prev; // rollback
        }
    }, { revalidate: false });
}
