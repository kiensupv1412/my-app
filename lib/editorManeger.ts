import { BaseEditorKit } from "@/components/editor/editor-base-kit";
import { EditorKit } from "@/components/editor/editor-kit";
import { createPlateEditor, ParagraphPlugin, usePlateEditor } from "platejs/react";
import { serializeCleanHtml } from "./serializeCleanHtml";
import { parseHtmlElement, serializeHtml } from "platejs";
import { ParagraphElement } from "@/components/editor/ui/paragraph-node";

export async function handlePreview(editor: any) {
    const html = await plateToHtml(editor)
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
        previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Preview</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; line-height: 1.6; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `);
        previewWindow.document.close();
    }
}

export async function plateToHtml(editor: any) {
    const serializeEditor = createPlateEditor({
        plugins: BaseEditorKit,
        value: editor.children,
    });

    return serializeCleanHtml(await serializeHtml(serializeEditor));
}

export function handleEditor({ mode, editor, defaultValue }: {
    mode: 'create' | 'edit',
    editor: any,
    defaultValue?: string | [],
}) {
    if (!editor) return;
    let valueType: [] | { type: string; value: any[]; } = [];

    if (mode === 'edit')
        valueType = detectContentType(defaultValue);
    if (mode === 'edit' && valueType?.type === 'html') {
        const element = parseHtmlElement(defaultValue as string);
        const nodes = editor.api.html.deserialize({
            element,
            collapseWhiteSpace: false,
            defaultElementPlugin: ParagraphPlugin.withComponent(ParagraphElement),
        });
        editor.tf.setValue(nodes);
    } else if (mode === 'edit' && valueType?.type === 'node') {
        editor.tf.setValue(valueType.value);
    } else if (mode === 'create') {
        editor.tf.setValue(valueType);
    }
}


function detectContentType(str: string) {
    try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed) && parsed[0]?.children) {
            return { type: "node", value: parsed };
        }
    } catch {
    }

    if (str.trim().startsWith("<")) {
        return { type: "html", value: str };
    }
}