// src/types/tanstack-table.d.ts
import 'next-auth';
import type { RowData } from '@tanstack/table-core';
import type { Categories } from '@/hooks/use-articles'; // hoặc nơi bạn định nghĩa
import type { Dispatch, SetStateAction } from 'react';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
    }
}
declare module '@tanstack/table-core' {
    interface ColumnMeta<TData extends RowData, TValue> {
        className?: string;
        headerClassName?: string;
        align?: 'left' | 'center' | 'right';
    }

    interface TableMeta<TData extends RowData> {
        categories?: Categories[];
        setFilters?: Dispatch<SetStateAction<{ category_id?: number; title?: string }>>;
    }
}

