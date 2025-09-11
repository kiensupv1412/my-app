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
            content: null,
            categoryId: categories?.[0]?.id ?? null,
            status: 'draft',
            // thêm field mặc định khác nếu bạn cần
        };
    }, [mode, articleId, articles, categories]);

    if (mode === 'edit' && !article) {
        return <div className="p-6">Article not found</div>;
    }

    return (
        <div className="flex h-full">
            <main className="flex-1 min-w-0">
                <div className="@container/main flex flex-col gap-4">
                    {/* Description (Inline) */}
                    <InlineEditor description={article?.description ?? ''} />

                    {/* Content editor */}
                    <SettingsProvider>
                        <PlateEditor />
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
