'use client';

import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import InlineEditor from '@/components/ui/description-edit';
import { useRootData } from '../providers/root-data';
import SidebarRight from './SidebarRight';

export default function NewsEditorPage({ id }: { id: string }) {
    const { articles, categories } = useRootData();
    const article = articles.find((a) => String(a.id) === id);

    if (!article) {
        return <div className="p-6">Article not found</div>;
    }

    return (
        <div className="flex  h-full">
            <main className="flex-1 min-w-0">
                <div className="@container/main flex flex-col gap-4">
                    <InlineEditor description={article.description} />
                    <SettingsProvider>
                        <PlateEditor />
                    </SettingsProvider>
                </div>
            </main>
            <SidebarRight
                article={article}
                className="hidden xl:block sticky top-[var(--header-height)] self-start h-[calc(100vh-var(--header-height))]" />
        </div>
    );
}
