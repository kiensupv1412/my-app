/*
 * path: components/news/NewsEditorPage.tsx
 */
'use client';

import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import InlineEditor from '@/components/ui/description-edit';
import { useMemo } from 'react';
import { useRootData } from '../providers/root-data';
import SidebarRight from './SidebarRight';

type Mode = 'create' | 'edit';
type Props = {
    mode: Mode;
    articleId?: string; // chỉ cần cho edit
};

// helper: đảm bảo luôn trả về Slate Value (mảng nodes)
function toSlateValue(raw: unknown) {
    const EMPTY: any[] = [{ type: 'p', children: [{ text: '' }] }];

    if (!raw && raw !== 0) return EMPTY;

    // đã là mảng nodes
    if (Array.isArray(raw)) return raw;

    // string: có thể là JSON chuỗi hoá
    if (typeof raw === 'string') {
        const s = raw.trim();
        if (!s) return EMPTY;

        // thử parse JSON
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // không phải JSON → coi như plain text
            return [{ type: 'p', children: [{ text: s }] }];
        }
    }

    // object (lỡ đâu body lưu ở field khác)
    if (typeof raw === 'object') {
        // nếu có dạng { nodes: [...] }
        const maybe = (raw as any)?.nodes;
        if (Array.isArray(maybe)) return maybe;
    }

    // fallback
    return EMPTY;
}

export default function NewsEditorScreen({ mode, articleId }: Props) {
    const { articles, categories } = useRootData();

    const article = useMemo(() => {
        if (mode === 'edit') {
            return articles.find((a: any) => String(a.id) === String(articleId));
        }
        // draft mặc định cho create
        return {
            id: undefined,
            title: '',
            description: '',
            body: null,
            categoryId: categories?.[0]?.id ?? null,
            status: '',
        };
    }, [mode, articleId, articles, categories]);

    if (mode === 'edit' && !article) {
        return <div className="p-6">Article not found</div>;
    }

    const slateValue = useMemo(() => toSlateValue(article?.body ?? null), [article?.body]);

    return (
        <div className="flex h-full">
            <main className="flex-1 min-w-0">
                <div className="@container/main flex flex-col gap-4">
                    <InlineEditor description={article?.description ?? ''} />
                    <SettingsProvider>
                        {/* truyền Slate Value đã chuẩn hoá */}
                        <PlateEditor content={slateValue} />
                    </SettingsProvider>
                </div>
            </main>

            <SidebarRight
                article={article as any}
                categories={categories}
                className="sticky top-[var(--header-height)] self-start h-[calc(100vh-var(--header-height))]"
            />
        </div>
    );
}