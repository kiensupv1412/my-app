// lib/fetcher.ts
export const fetcher = async (url: string) => {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
};
