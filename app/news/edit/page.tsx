/*
 * path: app/news/edit/page.tsx
 */

"use client"
import { useSearchParams } from 'next/navigation';

import { useArticle, useCategories } from '@/hooks/useArticles';
import { ContentEditor } from '@/components/news/ContentEditor';
import { MetaPanel } from '@/components/news/MetaPanel';
import { usePlateEditor } from 'platejs/react';
import { EditorDescKit } from '@/components/editor/editor-desc-kit';
import { EditorKit } from '@/components/editor/editor-kit';
import { Mode } from '@/types';

export default function Page() {
    const sp = useSearchParams();
    const id = sp.get('id') ?? '';
    const { article } = useArticle(id)
    const { categories } = useCategories()


    const descEditor = usePlateEditor({
        id: 'description',
        plugins: EditorDescKit,
        value: [{ type: 'p', children: [{ text: '' }] }],
    });

    const contentEditor = usePlateEditor({
        id: 'content',
        plugins: EditorKit,
        value: [],
    });

    const mode: Mode = article ? "edit" : "create";

    return (
        <div className="flex flex-1 flex-nowrap min-w-0">
            <ContentEditor mode={mode} article={article} descEditor={descEditor} contentEditor={contentEditor} />
            <MetaPanel mode={mode} article={article} categories={categories} descEditor={descEditor} contentEditor={contentEditor} />
        </div>)
}