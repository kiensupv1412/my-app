/*
 * path: components/news/NewsEditorPage.tsx
 */
'use client';

import { PlateEditor } from '@/components/editor/plate-editor';
import InlineEditor, { InlineEditorHandle } from '@/components/ui/description-edit';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { TableCellViewer } from '../dashboard/TableCellViewer';
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

type Mode = 'create' | 'edit';
type Props = {
    mode: Mode;
    articleId?: string;
};

export const ViewerContext = createContext<any>(null);

export default function NewsEditorScreen({ mode, articleId }: Props) {
    const [viewerOpen, setViewerOpen] = useState(false);
    const { articles } = useArticles();
    const { categories } = useCategories();

    const descRef = useRef<InlineEditorHandle>(null);

    let article: any = null;

    if (mode === 'edit') {
        article = articles.find((a: any) => String(a.id) === String(articleId)) ?? null;
    }

    const editor = usePlateEditor({
        plugins: EditorKit,
        value: [],
    });
    const initial = useMemo(() => article?.content ?? article?.body ?? null, [article]);
    useEffect(() => {
        if (!editor || initial == null) return;
        handleEditor({ mode, editor, defaultValue: initial });
        // guard để StrictMode dev không chạy 2 lần
        // hoặc check editor.children.length === 0 trước khi set
    }, [editor, initial, mode]);


    return (
        <ViewerContext.Provider value={{ viewerOpen, setViewerOpen }}>
            <DndProvider backend={HTML5Backend}>
                <Plate editor={editor}>
                    <EditorContainer>
                        <div className="flex h-full">
                            <main className="flex-1 min-w-0 border-r">
                                <div className="@container/main flex flex-col gap-4">
                                    <InlineEditor ref={descRef} description={article?.description ?? ''} />
                                    <PlateEditor />
                                </div>
                            </main>
                            <TableCellViewer
                                mode={mode}
                                editor={editor}
                                item={article}
                                categories={categories}
                                open={viewerOpen}
                                onOpenChange={setViewerOpen}
                                descRef={descRef}
                            />
                        </div>
                    </EditorContainer>
                </Plate>
            </DndProvider>
        </ViewerContext.Provider>
    );
}