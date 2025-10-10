/*
 * path: lib/serializeHtml/rules/rule-basic-blocks.ts
 */
// lib/serializeHtml/rules/rule-basic-blocks.ts
// Serialize các block cơ bản: p, h1..h6, blockquote, hr
// ⚠️ Loại trừ các node có listStyleType (đã do rule-list xử lý)

import type {
    SerializeRulePack,
    SlateNode,
    ElementAny,
    HeadingElement,
    ParagraphElement,
    BlockquoteElement,
    HrElement,
} from "@/types";

import { styleString, safeClassName } from "../serializer-core";
import { mergeAlignStyle } from "./rule-align";

// ---------- helpers ----------
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isListLike(n: ElementAny): boolean {
    return !!(n as any).listStyleType; // paragraph-as-list / heading-as-list / blockquote-as-list
}

// Chỉ match paragraph KHÔNG phải list
function isParagraph(n: SlateNode): n is ParagraphElement {
    return isElement(n) && n.type === "p" && !isListLike(n);
}
// Chỉ match heading KHÔNG phải list
function isHeading(n: SlateNode): n is HeadingElement {
    return (
        isElement(n) &&
        ["h1", "h2", "h3", "h4", "h5", "h6"].includes(n.type) &&
        !isListLike(n)
    );
}
// Chỉ match blockquote KHÔNG phải list
function isBlockquote(n: SlateNode): n is BlockquoteElement {
    return isElement(n) && n.type === "blockquote" && !isListLike(n);
}
function isHr(n: SlateNode): n is HrElement {
    return isElement(n) && n.type === "hr";
}

// ---------- block style mapping ----------
function appendUnit(v: unknown, unit: string): string | null {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return `${v}${unit}`;
    const s = String(v).trim();
    if (/^-?\d+(\.\d+)?[a-z%]+$/i.test(s)) return s;
    if (/^-?\d+(\.\d+)?$/.test(s)) return `${s}${unit}`;
    return s || null;
}

function buildBlockStyleObject(node: ElementAny): Record<string, unknown> {
    const style: Record<string, unknown> = {};
    if (node.lineHeight != null) style.lineHeight = node.lineHeight;

    // text-indent: ưu tiên textIndent, nếu không thì dùng indent (quy về em)
    if (node.textIndent != null) {
        const v = appendUnit(node.textIndent, "em");
        if (v) style.textIndent = v;
    } else if (node.indent != null) {
        const v = appendUnit(node.indent, "em");
        if (v) style.textIndent = v;
    }

    if (node.fontSize != null) style.fontSize = node.fontSize;
    if (node.fontFamily != null) style.fontFamily = node.fontFamily;
    if (node.fontWeight != null) style.fontWeight = node.fontWeight;

    if (node.color != null) style.color = node.color;
    if (node.backgroundColor != null) style.backgroundColor = node.backgroundColor;

    return style;
}

function buildStyleAttr(node: ElementAny): string | undefined {
    const base = styleString(buildBlockStyleObject(node));
    return mergeAlignStyle(base, node);
}

function classAttr(node: ElementAny, allow = false): string {
    if (!allow || !node.className) return "";
    const safe = safeClassName(node.className);
    return safe ? ` class="${safe}"` : "";
}

function idAttr(node: ElementAny): string {
    return node.id ? ` id="${String(node.id).replace(/"/g, "&quot;")}"` : "";
}

function openTagWithStyle(tag: string, node: ElementAny, allowClass: boolean, extraAttrs = ""): string {
    const style = buildStyleAttr(node);
    const cls = classAttr(node, allowClass);
    const id = idAttr(node);
    const styleAttr = style ? ` style="${style}"` : "";
    return `<${tag}${id}${cls}${styleAttr}${extraAttrs}>`;
}

// ---------- Rule Pack ----------
export const RuleBasicBlocks: SerializeRulePack = {
    name: "basic-blocks",
    priority: 0,
    rules: [
        // Paragraph <p> (chỉ khi KHÔNG có listStyleType)
        {
            name: "paragraph",
            match: isParagraph,
            serialize: (node, ctx) => {
                const open = openTagWithStyle("p", node, ctx.options.allowClassName);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</p>`;
            },
        },

        // Headings <h1>..</h6> (chỉ khi KHÔNG có listStyleType)
        {
            name: "heading",
            match: isHeading,
            serialize: (node, ctx) => {
                const tag = node.type; // "h1".."h6"
                const open = openTagWithStyle(tag, node, ctx.options.allowClassName);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</${tag}>`;
            },
        },

        // Blockquote (chỉ khi KHÔNG có listStyleType)
        {
            name: "blockquote",
            match: isBlockquote,
            serialize: (node, ctx) => {
                const open = openTagWithStyle("blockquote", node, ctx.options.allowClassName);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</blockquote>`;
            },
        },

        // Horizontal Rule
        {
            name: "hr",
            match: isHr,
            serialize: (node, ctx) => {
                const style = buildStyleAttr(node);
                const cls = classAttr(node, ctx.options.allowClassName);
                const id = idAttr(node);
                const styleAttr = style ? ` style="${style}"` : "";
                return `<hr${id}${cls}${styleAttr}/>`;
            },
        },
    ],
};
