/*
 * path: components/modals/contents/pickThumb.tsx
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

type MediaItem = {
    id: string | number;
    url: string;
    thumb?: string;
    width?: number;
    height?: number;
    alt?: string | null;
};

type ApiList<T> =
    | { data: T[]; page?: number; per_page?: number; total?: number }
    | T[];

// ĐỔI CHO ĐÚNG API CỦA BẠN
const MEDIA_ENDPOINT = '/api/media?type=image';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Props = {
    title?: string;
    initial?: MediaItem | null;
    onResolve: (v: MediaItem | null) => void;
    onClose: () => void;
};

export default function PickThumb({ title, initial, onResolve, onClose }: Props) {
    const [page, setPage] = React.useState<number>(1);
    const [q, setQ] = React.useState<string>('');
    const [pendingQ, setPendingQ] = React.useState<string>('');
    const [selected, setSelected] = React.useState<MediaItem | null>(initial ?? null);

    const qs = React.useMemo(() => {
        const u = new URL(MEDIA_ENDPOINT, 'http://local.fake'); // base fake để build query
        u.searchParams.set('page', String(page));
        if (q) u.searchParams.set('q', q);
        return u.pathname + u.search;
    }, [page, q]);

    const { data, isLoading, mutate } = useSWR<ApiList<MediaItem>>(qs, fetcher, {
        revalidateOnFocus: false,
    });

    // chuẩn hóa data về array
    const items: MediaItem[] = React.useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return data.data ?? [];
    }, [data]);

    const total = React.useMemo(() => (Array.isArray(data) ? undefined : data?.total), [data]);
    const perPage = React.useMemo(() => (Array.isArray(data) ? 24 : data?.per_page ?? 24), [data]);
    const maxPage = React.useMemo(() => {
        if (!total || !perPage) return undefined;
        return Math.max(1, Math.ceil(total / perPage));
    }, [total, perPage]);

    // reset khi initial đổi (mỗi lần mở modal mới)
    React.useEffect(() => {
        setPage(1);
        setQ('');
        setPendingQ('');
        setSelected(initial ?? null);
    }, [initial]);

    const onConfirm = () => onResolve(selected ?? null);
    const onCancel = () => onClose();

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setQ(pendingQ.trim());
    };

    const onPick = (m: MediaItem) => setSelected(m);
    const onPickAndConfirm = (m: MediaItem) => {
        setSelected(m);
        onResolve(m);
    };

    const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(' ');

    return (
        <div className="p-2">
            <DrawerHeader className="px-0">
                <DrawerTitle>{title ?? 'Chọn thumbnail'}</DrawerTitle>
                <DrawerDescription>Bấm 2 lần để chọn nhanh, hoặc chọn rồi nhấn “Chọn”.</DrawerDescription>
            </DrawerHeader>

            <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
                <Input
                    placeholder="Tìm theo tên/alt/đường dẫn…"
                    value={pendingQ}
                    onChange={(e) => setPendingQ(e.target.value)}
                />
                <Button type="submit">Tìm</Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setPendingQ(''); setQ(''); setPage(1); }}
                >
                    Xóa lọc
                </Button>
                <Button type="button" variant="outline" onClick={() => mutate()}>
                    Tải lại
                </Button>
            </form>

            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[60vh] overflow-auto p-1">
                {isLoading && Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-24 w-full animate-pulse rounded-md bg-muted" />
                ))}

                {!isLoading && items.length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground py-8 text-center">
                        Không có ảnh phù hợp.
                    </div>
                )}

                {items.map((m) => {
                    const isSel = selected?.id === m.id;
                    const src = m.thumb || m.url;
                    return (
                        <button
                            key={String(m.id)}
                            type="button"
                            title={m.alt ?? m.url}
                            onClick={() => onPick(m)}
                            onDoubleClick={() => onPickAndConfirm(m)}
                            className={cx(
                                'relative h-24 w-full overflow-hidden rounded-md border',
                                'hover:ring-2 hover:ring-primary transition',
                                isSel && 'ring-2 ring-primary border-primary'
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={m.alt ?? 'thumb'} className="h-full w-full object-cover" loading="lazy" />
                            {isSel && (
                                <span className="absolute right-1 top-1 text-[10px] rounded bg-primary px-1.5 py-0.5 text-primary-foreground">
                                    Đã chọn
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-muted-foreground">
                    {typeof total === 'number' ? `Tổng ${total} ảnh` : null}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Trước
                    </Button>
                    <div className="text-sm">Trang {page}{maxPage ? ` / ${maxPage}` : ''}</div>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!!maxPage && page >= maxPage}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Sau
                    </Button>
                </div>
            </div>

            <DrawerFooter className="px-0">
                <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
                <Button type="button" onClick={onConfirm} disabled={!selected}>Chọn</Button>
            </DrawerFooter>
        </div>
    );
}
