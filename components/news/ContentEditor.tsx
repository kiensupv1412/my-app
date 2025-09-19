import { Plate } from "platejs/react";
import { EditorContainer } from "../editor/ui/editor";
import { PlateEditor } from "../editor/plate-editor";
import { Article, Mode } from "@/types";
import { useEffect } from "react";
import { handleEditor } from "@/lib/editorManeger";

export function ContentEditor({ mode, article, descEditor, contentEditor }: { mode: Mode, article: Article | null, descEditor: any, contentEditor: any }) {

    const initialContent = article?.content ?? article?.content_html ?? null
    useEffect(() => {
        if (!contentEditor || initialContent == null) return;
        handleEditor({ mode, editor: contentEditor, defaultValue: initialContent });
    }, [initialContent]);

    const initialDescription = article?.description ?? article?.description_html ?? null
    useEffect(() => {
        if (!descEditor || initialDescription == null) return;
        handleEditor({ mode, editor: descEditor, defaultValue: initialDescription });
    }, [initialDescription]);

    return (
        <div className="w-full flex flex-col gap-4 border-r">
            <Plate editor={descEditor}>
                <EditorContainer>
                    <PlateEditor />
                </EditorContainer>
            </Plate>
            <Plate editor={contentEditor}>
                <EditorContainer>
                    <PlateEditor />
                </EditorContainer>
            </Plate>
        </div>)
}