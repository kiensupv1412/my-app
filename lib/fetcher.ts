// // path: /lib/fetcher.ts

// import { apiFetch } from "./http";

// // optional: cùng logic build query khi dùng key tuple
// function qs(params: Record<string, string | number | null | undefined>) {
//     const parts: string[] = [];
//     for (const k in params) {
//         const v = params[k];
//         if (v === undefined || v === null) continue;
//         parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
//     }
//     return parts.length ? '?' + parts.join('&') : '';
// }

// type SWRKey = string | readonly [string, Record<string, any>?];

// function keyToUrl(key: SWRKey): string {
//     if (typeof key === 'string') return key;
//     const [base, params] = key;
//     return params ? base + qs(params) : base;
// }

// // [CHUẨN HÓA] dùng apiFetch để nhận về AppError + parse JSON an toàn
// export const fetcher = async (key: SWRKey) => {
//     const url = keyToUrl(key);
//     return apiFetch(url, {
//         credentials: 'include',
//         headers: { Accept: 'application/json' },
//     });
// };
