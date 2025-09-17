/*
 * path: components/news/NewsEditorPage.tsx
 */
'use client';
import { PlateEditor } from '@/components/editor/plate-editor';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ParagraphPlugin, usePlateState } from 'platejs/react';

import { Plate, useEditorRef, usePlateEditor } from 'platejs/react';
import { EditorKit } from '@/components/editor/editor-kit';
import { parseHtmlElement } from 'platejs';
import { EditorContainer } from '../editor/ui/editor';
import React from 'react';
import { ParagraphElement } from '../editor/ui/paragraph-node';
import { handleEditor } from '@/lib/editorManeger';
import { useArticles, useCategories } from '@/hooks/useArticles';
import { BaseEditorKit } from '../editor/editor-base-kit';
import { EditorDescKit } from '../editor/editor-desc-kit';

type Mode = 'create' | 'edit';
type Props = {
    mode: Mode;
    articleId?: string;
};

export const ViewerContext = createContext<any>(null);

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

    const descriptionEditor = usePlateEditor({
        id: 'description',
        plugins: EditorDescKit,
        value: [],
    });

    const contentEditor = usePlateEditor({
        id: 'content',
        plugins: EditorKit,
        value: [],
    });

    const initialBody = useMemo(() => article?.content ?? article?.body ?? null, [article]);
    useEffect(() => {
        if (!contentEditor || initialBody == null) return;
        handleEditor({ mode, contentEditor, defaultValue: initialBody });
    }, [contentEditor, initialBody, mode]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-full">
                <main className="flex-1 min-w-0 border-r">
                    <div className="@container/main flex flex-col gap-4">
                        <Plate editor={descriptionEditor}>
                            <EditorContainer>
                                <PlateEditor />
                            </EditorContainer>
                        </Plate>
                        <Plate editor={contentEditor}>
                            <EditorContainer>
                                <PlateEditor />
                            </EditorContainer>
                        </Plate>
                    </div>
                </main>
            </div>
        </DndProvider>
    );
}