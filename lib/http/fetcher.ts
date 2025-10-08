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
