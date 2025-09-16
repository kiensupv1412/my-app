/*
 * path: components/news/NewsEditorPage.tsx
 */
'use client';

import { PlateEditor } from '@/components/editor/plate-editor';
import InlineEditor, { InlineEditorHandle } from '@/components/ui/description-edit';
import { createContext, useEffect, useRef, useState } from 'react';
import { useRootData } from '../providers/root-data';
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

type Mode = 'create' | 'edit';
type Props = {
    mode: Mode;
    articleId?: string;
};

export const ViewerContext = createContext<any>(null);

export default function NewsEditorScreen({ mode, articleId }: Props) {
    const [viewerOpen, setViewerOpen] = useState(false);
    const { articles, categories } = useRootData();

    const descRef = useRef<InlineEditorHandle>(null);

    let article: any = null;
    let defaultValue: any = null;

    if (mode === 'edit') {
        article = articles.find((a: any) => String(a.id) === String(articleId)) ?? null;
        defaultValue = article?.content
            ? article.content
            : article?.body ?? null;
    }

    const editor = usePlateEditor({
        plugins: EditorKit,
        value: [],
    });
    useEffect(() => {
        handleEditor({ mode, editor, defaultValue });
    }, [mode, defaultValue, editor]);

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