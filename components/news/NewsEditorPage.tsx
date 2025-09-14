/*
 * path: components/news/NewsEditorPage.tsx
 */
'use client';

import { PlateEditor } from '@/components/editor/plate-editor';
import InlineEditor from '@/components/ui/description-edit';
import { useMemo } from 'react';
import { useRootData } from '../providers/root-data';
import SidebarRight from './SidebarRight';

type Mode = 'create' | 'edit';
type Props = {
    mode: Mode;
    articleId?: string; // chỉ cần cho edit
};

export default function NewsEditorScreen({ mode, articleId }: Props) {
    const { articles, categories } = useRootData();

    let article: any = null;
    let slateValue: any = null;

    if (mode === 'edit') {
        article = articles.find((a: any) => String(a.id) === String(articleId)) ?? null;
        slateValue = article?.content ?? article?.body ?? null;
    }

    return (
        <div className="flex h-full">
            <main className="flex-1 min-w-0">
                <div className="@container/main flex flex-col gap-4">
                    <InlineEditor description={article?.description ?? ''} />
                    <PlateEditor mode={mode} content={slateValue} />
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