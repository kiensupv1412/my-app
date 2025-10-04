import React from 'react';
import { Button } from './button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import { PaginationData } from '@/types';

export type PaginationProps = PaginationData & {
    onChangeLimit?: (n: number) => void;   // <- thêm
    perPageOptions?: number[];             // <- thêm
};

const Pagination: React.FC<PaginationProps> = ({
    page,
    pages,
    limit,
    total,
    prevPage,
    nextPage,
    setPage,
    onChangeLimit,
    perPageOptions = [10, 20, 50, 100],    // default
}) => {
    const startIndex = (page - 1) * limit + 1;
    const endIndex = total ? Math.min(total, startIndex + limit - 1) : (startIndex + limit - 1);

    const totalPages = pages ?? (total ? Math.max(1, Math.ceil(total / Math.max(1, limit))) : null);
    const hasPrev = page > 1;
    const hasNext = totalPages ? page < totalPages : (total ? endIndex < total : false);

    const gotoFirst = () => setPage(1);
    const gotoLast = () => { if (totalPages) setPage(totalPages); };

    if (total && limit < total) {
        return (
            <div className="mt-1 flex items-center gap-3 text-xs text-grey-700">
                <span>Showing {startIndex}-{endIndex} of {total}</span>
                {onChangeLimit && (
                    <div className="flex items-center gap-2">
                        <Label htmlFor="per-page-select" className="text-muted-foreground">Per page:</Label>
                        <Select
                            value={String(limit)}
                            onValueChange={(value) => onChangeLimit(Number(value))}
                        >
                            <SelectTrigger id="per-page-select" className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {perPageOptions.map(n => (
                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={!hasPrev} onClick={gotoFirst} title="Trang đầu">
                        <IconChevronsLeft />
                    </Button>
                    <Button variant="outline" size="sm" disabled={!hasPrev} onClick={prevPage} title="Trang trước">
                        <IconChevronLeft />
                    </Button>
                    <span className="px-2">
                        Page <b>{page}</b>{totalPages ? <> / {totalPages}</> : null}
                    </span>
                    <Button variant="outline" size="sm" disabled={!hasNext} onClick={nextPage} title="Trang sau">
                        <IconChevronRight />
                    </Button>
                    <Button variant="outline" size="sm" disabled={!hasNext || !totalPages} onClick={gotoLast} title="Trang cuối">
                        <IconChevronsRight />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-1 flex items-center gap-3 text-xs text-grey-700">
            <span>Showing {total ?? '?'} in total</span>
            {onChangeLimit && (
                <label className="flex items-center gap-1">
                    <span className="text-muted-foreground">Per page:</span>
                    <select
                        className="h-8 rounded border px-2"
                        value={limit}
                        onChange={(e) => onChangeLimit(Number(e.target.value))}
                    >
                        {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
            )}
        </div>
    );
};

export default Pagination;
