// [MOVE] fetcher mỏng, tái dùng apiFetch + key tuple
import { apiFetch } from './http';
import { keyToUrl, SWRKey } from './url';

export const fetcher = async (key: SWRKey) => {
    const url = keyToUrl(key);
    return apiFetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
};


export async function apiWithSession(url: string, accessToken: string) {
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${url}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
        cache: "no-store",
    });
    if (!r.ok) throw new Error('Unauthorized');
    return r.json();
}
