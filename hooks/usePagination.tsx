import { PaginationData, PaginationMeta } from '@/types';
import { useEffect, useState } from 'react';


export const usePageLimit = (initialPage = 1, initialLimit = 10) => {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    return { page, setPage, limit, setLimit };
};



export const usePagination = ({ limit, setLimit, meta, page, setPage }: {
    meta?: PaginationMeta,
    limit: number,
    setLimit: React.Dispatch<React.SetStateAction<number>>,
    page: number,
    setPage: React.Dispatch<React.SetStateAction<number>>
}): PaginationData => {
    const [prevMeta, setPrevMeta] = useState<PaginationMeta | undefined>(meta);

    useEffect(() => {
        if (!meta) return;
        setPrevMeta(meta);
        if (meta.pages > 0 && page > meta.pages) {
            setPage(p => (p === meta.pages ? p : meta.pages));
        }
        if (typeof meta.limit === 'number' && meta.limit > 0 && meta.limit !== limit) {
            setLimit(meta.limit);
        }
    }, [meta?.pages, meta?.limit, meta?.total]);

    return {
        page,
        setPage,
        pages: prevMeta?.pages ?? null,
        total: prevMeta?.total ?? null,
        limit: prevMeta?.limit && prevMeta.limit !== 'all' ? prevMeta.limit : limit,
        setLimit,
        nextPage: () => setPage(Math.min(page + 1, prevMeta?.pages ? prevMeta.pages : page)),
        prevPage: () => setPage(Math.max(1, page - 1))
    };
};
