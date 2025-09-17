/*
 * path: components/news/NewsEditorPage.tsx
 */
'use client';
import { PlateEditor } from '@/components/editor/plate-editor';
import { useEffect, useMemo } from 'react';

import { Plate, usePlateEditor } from 'platejs/react';
import { EditorKit } from '@/components/editor/editor-kit';
import { normalizeNodeId, parseHtmlElement } from 'platejs';
import { EditorContainer } from '../editor/ui/editor';
import React from 'react';
import { handleEditor } from '@/lib/editorManeger';
import { useArticles, useCategories } from '@/hooks/useArticles';
import { EditorDescKit } from '../editor/editor-desc-kit';
import { Button } from '../ui/button';
import { NewsEditorProvider } from '../providers/news-editor-provider';

type Mode = 'create' | 'edit';
type Props = {
    mode: Mode;
    articleId?: string;
};

export default function NewsEditorScreen({ mode, articleId }: Props) {
    const { articles } = useArticles();
    const { categories } = useCategories();

    let article: any = null;

    if (mode === 'edit') {
        article = useMemo(
            () => (mode === 'edit' ? (articles || []).find((a: any) => String(a.id) === String(articleId)) ?? null : null),
            [mode, articleId, articles]
        );
    }

    const descEditor = usePlateEditor({
        id: 'description',
        plugins: EditorDescKit,
        value: () => normalizeNodeId(
            [
                {
                    children: [
                        {
                            text: 'khi gán link bắt đầu bằng /'
                        }
                    ],
                    type: 'p'
                }
            ]
        )
    });

    const contentEditor = usePlateEditor({
        id: 'content',
        plugins: EditorKit,
        value: []
    })

    const initialBody = useMemo(() => article?.content ?? article?.body ?? null, [article]);
    useEffect(() => {
        if (!contentEditor || initialBody == null) return;
        handleEditor({ mode, contentEditor, defaultValue: initialBody });
    }, [contentEditor, initialBody, mode]);

    return (
        <NewsEditorProvider article={article} categories={categories} mode={mode}>
            <div className="flex h-full">
                <main className="flex-1 min-w-0 border-r">
                    <div className="@container/main flex flex-col gap-4">
                        <Plate editor={descEditor}>
                            <EditorContainer>
                                <PlateEditor />
                            </EditorContainer>
                        </Plate>
                        <Plate editor={contentEditor} >
                            <EditorContainer>
                                <Button>html</Button>
                                <PlateEditor />
                            </EditorContainer>
                        </Plate>
                    </div>
                </main>
            </div>
        </NewsEditorProvider>
    );
}