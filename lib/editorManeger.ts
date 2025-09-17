/*
 * path: lib/editorManeger.ts
 */

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

type SlateNodes = any[]; // thay bằng type thực tế nếu có

type DetectResult =
    | { kind: 'nodes'; value: SlateNodes }
    | { kind: 'html'; value: string }
    | { kind: 'empty' };

function isSlateNodes(v: unknown): v is SlateNodes {
    return Array.isArray(v) && (v.length === 0 || v[0]?.children);
}

function detectContentType(input: unknown): DetectResult {
    if (input == null) return { kind: 'empty' };

    // 1) Đã là nodes
    if (isSlateNodes(input)) return { kind: 'nodes', value: input };

    // 2) Là string
    if (typeof input === 'string') {
        const s = input.trim();
        // 2a) Thử JSON → nodes
        try {
            const parsed = JSON.parse(s);
            if (isSlateNodes(parsed)) return { kind: 'nodes', value: parsed };
        } catch {/* ignore */ }

        // 2b) HTML string
        if (s.startsWith('<')) return { kind: 'html', value: s };

        // 2c) Rỗng/không hợp lệ
        if (!s) return { kind: 'empty' };
    }

    return { kind: 'empty' };
}

// Idempotent: chỉ setValue khi thực sự có nội dung mới
export function handleEditor({
    mode,
    contentEditor,
    defaultValue,
}: {
    mode: 'create' | 'edit';
    contentEditor: any;
    defaultValue?: unknown;
}) {
    if (!contentEditor) return;

    const detected = detectContentType(defaultValue);

    let nextValue: SlateNodes = [];

    if (mode === 'create') {
        nextValue = [];
    } else {
        if (detected.kind === 'nodes') {
            nextValue = detected.value ?? [];
        } else if (detected.kind === 'html') {
            const el = document.createElement('div');
            el.innerHTML = detected.value;
            const element = el; // hoặc parseHtmlElement(el) nếu cần Element đã chuẩn hoá
            const nodes = contentEditor.api.html.deserialize({
                element,
                collapseWhiteSpace: false,
                defaultElementPlugin: ParagraphPlugin.withComponent(ParagraphElement),
            });
            nextValue = nodes ?? [];
        } else {
            nextValue = [];
        }
    }

    const curr = contentEditor.children as SlateNodes;
    const same =
        Array.isArray(curr) &&
        Array.isArray(nextValue) &&
        curr.length === nextValue.length &&
        JSON.stringify(curr) === JSON.stringify(nextValue);

    if (!same) {
        contentEditor.tf.setValue(nextValue);
    }
}
