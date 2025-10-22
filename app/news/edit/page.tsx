/*
 * path: app/news/edit/page.tsx
 */

"use client"
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useArticleEdit } from '@/hooks/use-articles';
import { useCategories } from '@/hooks/use-categories';
import { MetaPanel } from '@/components/news/MetaPanel';
import { usePlateEditor } from 'platejs/react';
import { EditorDescKit } from '@/components/editor/editor-desc-kit';
import { EditorKit } from '@/components/editor/editor-kit';
import { Plate } from "platejs/react";
import { useEffect } from "react";
import { handleEditor } from "@/lib/editorManeger";
import { Mode } from '@/types';
import { Editor, EditorContainer } from '@/components/editor/ui/editor';
import { PlateEditor } from '@/components/editor/plate-editor';

export default function Page() {
    return (
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Đang tải…</div>}>
            <EditPageInner />
        </Suspense>
    );
}

function EditPageInner() {
    const sp = useSearchParams();
    const id = sp.get('id') ?? '';
    const { article } = useArticleEdit(id)
    const { categories } = useCategories()

    const description_Editor = usePlateEditor({
        id: 'description',
        plugins: EditorDescKit,
        value: [],
    });

    const content_Editor = usePlateEditor({
        id: 'content',
        plugins: EditorKit,
        value: [],
    });

    const mode: Mode = article ? "edit" : "create";

    const initialContent = article?.content || article?.content_html || null
    useEffect(() => {
        if (!content_Editor || initialContent == null) return;
        handleEditor({ mode, editor: content_Editor, defaultValue: initialContent });
    }, [initialContent]);

    const initialDescription = article?.description || article?.description_html || null
    useEffect(() => {
        if (!description_Editor || initialDescription == null) return;
        handleEditor({ mode, editor: description_Editor, defaultValue: initialDescription });
    }, [initialDescription]);

    return (
        <div className="flex flex-1 min-h-0">
            <div className="w-full flex flex-col gap-4 border-r min-h-0 grow overflow-y-auto">
                <Plate editor={description_Editor}>
                    <EditorContainer className="h-auto">
                        <PlateEditor id={"description"} />
                    </EditorContainer>
                </Plate>
                <div className="flex flex-col flex-1 relative">
                    <Plate editor={content_Editor}>
                        <EditorContainer className="flex flex-col flex-1">
                            <Editor id={"content"} />
                        </EditorContainer>
                    </Plate>
                </div>
            </div>
            <MetaPanel
                mode={mode}
                article={article}
                categories={categories}
                description_Editor={description_Editor}
                content_Editor={content_Editor}
            />
        </div>
    );
}
