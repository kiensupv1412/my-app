/*
 * path: lib/editorManeger.ts
 */

import { ParagraphPlugin } from "platejs/react";
import { ParagraphElement } from "@/components/editor/ui/paragraph-node";

type SlateNodes = any[];
type DetectResult =
    | { kind: 'nodes'; value: SlateNodes }
    | { kind: 'html'; value: string }
    | { kind: 'text'; value: string }
    | { kind: 'empty' };

function isSlateNodes(v: unknown): v is SlateNodes {
    return Array.isArray(v) && (v.length === 0 || v[0]?.children);
}

const HTML_TAG_RE = /<([A-Za-z][A-Za-z0-9-]*)(\s[^>]*)?>/;
function detectContentType(input: unknown): DetectResult {
    if (input == null) return { kind: 'empty' };

    // 1) Đã là nodes
    if (isSlateNodes(input)) return { kind: 'nodes', value: input };

    // 2) String
    if (typeof input === 'string') {
        const s = input.trim();

        // 2a) JSON -> nodes
        try {
            const parsed = JSON.parse(s);
            if (isSlateNodes(parsed)) return { kind: 'nodes', value: parsed };
        } catch { /* ignore */ }

        // 2b) HTML string
        if (HTML_TAG_RE.test(s)) return { kind: 'html', value: s };

        // 2c) Text thuần (không rỗng)
        if (s) return { kind: 'text', value: s };

        // 2d) Rỗng
        return { kind: 'empty' };
    }

    return { kind: 'empty' };
}

function textToNodes(text: string): SlateNodes {
    // Chuẩn hoá line endings
    const norm = text.replace(/\r\n?/g, '\n');

    // Tách paragraph theo 1+ dòng trống
    const paragraphs = norm.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);

    // Nếu không có \n\n nhưng vẫn có nội dung -> một đoạn
    if (paragraphs.length === 0 && norm.trim()) {
        paragraphs.push(norm.trim());
    }

    const makeChildrenFromLines = (p: string) => {
        const lines = p.split('\n');
        // ghép các line thành chuỗi với \n nằm trong cùng 1 text node
        // (nếu bạn có SoftBreakPlugin, có thể map mỗi \n thành element soft-break)
        return [{ text: lines.join('\n') }];
    };

    return paragraphs.map(p => ({
        type: 'p',                 // hoặc type paragraph thực tế của bạn
        children: makeChildrenFromLines(p),
    }));
}

export function handleEditor({
    mode,
    editor,
    defaultValue,
}: {
    mode: 'create' | 'edit';
    editor: any;
    defaultValue?: unknown;
}) {
    if (!editor) return;

    const detected = detectContentType(defaultValue);
    let nextValue: SlateNodes = [];

    if (mode === 'create') {
        nextValue = [];
    } else {
        if (detected.kind === 'nodes') {
            nextValue = detected.value ?? [];
        } else if (detected.kind === 'html') {
            const el = document.createElement('div');
            let cleanedHtml = detected.value
                .replace(/>\s+</g, '><')
                .replace(/<\/p>\s*<br\s*\/?>\s*<p>/gi, '</p><p>')
                .replace(/<p>\s*(?:<br\s*\/?>\s*)+<\/p>/gi, '')
                .trim();
            el.innerHTML = cleanedHtml;
            const nodes = editor.api.html.deserialize({
                element: el,
                collapseWhiteSpace: true,
                defaultElementPlugin: ParagraphPlugin.withComponent(ParagraphElement),
            });
            nextValue = nodes ?? [];
        } else if (detected.kind === 'text') {
            nextValue = textToNodes(detected.value);
        } else {
            nextValue = [];
        }
    }

    editor.tf.setValue(nextValue);
}