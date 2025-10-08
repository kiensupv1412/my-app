// [GỘP] qs dùng chung cho api & swr key
export function qs(params: Record<string, string | number | null | undefined>) {
    const parts: string[] = [];
    for (const k in params) {
        const v = params[k];
        if (v === undefined || v === null) continue;
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
    }
    return parts.length ? '?' + parts.join('&') : '';
}

export type SWRKey = string | readonly [string, Record<string, any>?];

export function keyToUrl(key: SWRKey): string {
    if (typeof key === 'string') return key;
    const [base, params] = key;
    return params ? base + qs(params) : base;
}

// optional: gắn base khi gọi thủ công
export function withBase(base: string, path: string) {
    if (!base) return path;
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
}
