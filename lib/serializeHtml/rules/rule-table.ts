/*
 * path: lib/serializeHtml/rules/rule-table.ts
 */
// lib/serializeHtml/rules/rule-table.ts
// Serialize bảng: <table> / <tr> / <th> / <td>
// - Hỗ trợ <colgroup> từ table.colSizes
// - Hỗ trợ cell: rowSpan/colSpan → attr rowspan/colspan
// - Border theo cạnh: borderTop/Right/Bottom/Left (px); có thể dùng borderStyle/borderColor chung
// - Map width/height cell: nếu là số → attr; nếu là chuỗi có đơn vị → để trong style
// - Merge typography & align (nếu bạn đã dùng rule-font, có thể thay style builder bằng helper đó)

import type {
    SerializeRulePack,
    SlateNode,
    ElementAny,
    TableElement,
    TrElement,
    ThElement,
    TdElement,
} from "@/types";

import {
    styleString,
    safeClassName,
} from "../serializer-core";
import { mergeAlignStyle } from "./rule-align";

// ---------- type guards ----------
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isTable(n: SlateNode): n is TableElement {
    return isElement(n) && n.type === "table";
}
function isTr(n: SlateNode): n is TrElement {
    return isElement(n) && n.type === "tr";
}
function isTh(n: SlateNode): n is ThElement {
    return isElement(n) && n.type === "th";
}
function isTd(n: SlateNode): n is TdElement {
    return isElement(n) && n.type === "td";
}

// ---------- helpers ----------
function appendUnit(v: unknown, unit: string): string | null {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return `${v}${unit}`;
    const s = String(v).trim();
    if (!s) return null;
    if (/^-?\d+(\.\d+)?[a-z%]+$/i.test(s)) return s;
    if (/^-?\d+(\.\d+)?$/.test(s)) return `${s}${unit}`;
    return s;
}

function asNumString(v: unknown): string | undefined {
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return v.trim();
    return undefined;
}

function classAttr(node: ElementAny, allow = false): string | undefined {
    if (!allow || !node.className) return undefined;
    const safe = safeClassName(node.className);
    return safe || undefined;
}
function idAttr(node: ElementAny): string | undefined {
    return node.id ? String(node.id) : undefined;
}

function openTag(tag: string, attrs: Record<string, string | undefined>): string {
    const parts: string[] = [tag];
    for (const [k, v] of Object.entries(attrs)) {
        if (!v) continue;
        parts.push(`${k}="${v.replace(/"/g, "&quot;")}"`);
    }
    return `<${parts.join(" ")}>`;
}

function colWidthToStyle(v: number | string): string | undefined {
    if (typeof v === "number") {
        if (v > 0 && v <= 1) return `width:${v * 100}%;`;
        return `width:${v}px;`;
    }
    const s = String(v).trim();
    if (!s) return undefined;
    if (/^-?\d+(\.\d+)?[a-z%]+$/i.test(s)) return `width:${s};`;
    if (/^-?\d+(\.\d+)?$/.test(s)) return `width:${s}px;`;
    return undefined;
}

function renderColGroup(colSizes?: Array<number> | undefined): string {
    if (!colSizes || !Array.isArray(colSizes) || colSizes.length === 0) return "";
    const cols = colSizes
        .map((w) => {
            const st = colWidthToStyle(w as any);
            return st ? `<col style="${st}"/>` : "<col/>";
        })
        .join("");
    return `<colgroup>${cols}</colgroup>`;
}

// ---------- style builders ----------
function buildTableStyle(node: ElementAny): string | undefined {
    const style: Record<string, unknown> = {};
    if (node.lineHeight != null) style.lineHeight = node.lineHeight;
    if ((node as any).fontSize != null) style.fontSize = (node as any).fontSize;
    if ((node as any).fontFamily != null) style.fontFamily = (node as any).fontFamily;
    if ((node as any).fontWeight != null) style.fontWeight = (node as any).fontWeight;
    if ((node as any).color != null) style.color = (node as any).color;
    if ((node as any).backgroundColor != null) style.backgroundColor = (node as any).backgroundColor;

    if ((node as any).marginLeft != null) {
        const ml = appendUnit((node as any).marginLeft, "px");
        if (ml) style.marginLeft = ml;
    }

    const base = styleString(style) || undefined;
    return mergeAlignStyle(base, node);
}

function buildCellBorderCss(node: ThElement | TdElement): string {
    const styleParts: string[] = [];

    // Nếu có style/color chung
    const commonStyle = (node as any).borderStyle || "solid";
    const commonColor = (node as any).borderColor || "currentColor";

    const edge = (size: unknown, side: "top" | "right" | "bottom" | "left") => {
        const n = typeof size === "number" ? size : Number(String(size));
        if (!Number.isFinite(n) || n < 0) return;
        styleParts.push(`border-${side}-width:${n}px`);
        if (n > 0) {
            styleParts.push(`border-${side}-style:${commonStyle}`);
            styleParts.push(`border-${side}-color:${commonColor}`);
        } else {
            // 0 → none
            styleParts.push(`border-${side}-style:none`);
        }
    };

    edge((node as any).borderTop, "top");
    edge((node as any).borderRight, "right");
    edge((node as any).borderBottom, "bottom");
    edge((node as any).borderLeft, "left");

    return styleParts.join(";");
}

function buildCellStyle(node: ElementAny): string | undefined {
    const style: Record<string, unknown> = {};
    if (node.lineHeight != null) style.lineHeight = node.lineHeight;
    if ((node as any).fontSize != null) style.fontSize = (node as any).fontSize;
    if ((node as any).fontFamily != null) style.fontFamily = (node as any).fontFamily;
    if ((node as any).fontWeight != null) style.fontWeight = (node as any).fontWeight;
    if ((node as any).color != null) style.color = (node as any).color;
    if ((node as any).backgroundColor != null) style.backgroundColor = (node as any).backgroundColor;

    let s = styleString(style) || "";
    // Border theo cạnh (nếu có)
    if (isTh(node) || isTd(node)) {
        const borderCss = buildCellBorderCss(node);
        if (borderCss) s = s ? `${s};${borderCss}` : borderCss;
    }

    const merged = mergeAlignStyle(s, node);
    return merged;
}

// ---------- Rule Pack ----------
export const RuleTable: SerializeRulePack = {
    name: "table",
    priority: 0,
    rules: [
        // <table>
        {
            name: "table",
            match: isTable,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const cls = classAttr(node, ctx.options.allowClassName);
                const id = idAttr(node);
                const style = buildTableStyle(node);

                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if (style) attrs.style = style;

                const open = openTag("table", attrs);
                const colgroup = renderColGroup(node.colSizes as any);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${colgroup}${inner}</table>`;
            },
        },

        // <tr>
        {
            name: "tr",
            match: isTr,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const cls = classAttr(node, ctx.options.allowClassName);
                const id = idAttr(node);
                const style = buildTableStyle(node); // hàng có thể thừa hưởng style chung

                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if (style) attrs.style = style;

                const open = openTag("tr", attrs);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</tr>`;
            },
        },

        // <th>
        {
            name: "th",
            match: isTh,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const cls = classAttr(node, ctx.options.allowClassName);
                const id = idAttr(node);
                const style = buildCellStyle(node);

                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if (style) attrs.style = style;

                // colspan/rowspan
                if (typeof node.colSpan === "number" && node.colSpan > 1) {
                    attrs.colspan = String(node.colSpan);
                }
                if (typeof node.rowSpan === "number" && node.rowSpan > 1) {
                    attrs.rowspan = String(node.rowSpan);
                }

                // width/height attr nếu là số trần
                const w = asNumString((node as any).width);
                const h = asNumString((node as any).height);
                if (w) attrs.width = w;
                if (h) attrs.height = h;

                const open = openTag("th", attrs);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</th>`;
            },
        },

        // <td>
        {
            name: "td",
            match: isTd,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const cls = classAttr(node, ctx.options.allowClassName);
                const id = idAttr(node);
                const style = buildCellStyle(node);

                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if (style) attrs.style = style;

                // colspan/rowspan
                if (typeof node.colSpan === "number" && node.colSpan > 1) {
                    attrs.colspan = String(node.colSpan);
                }
                if (typeof node.rowSpan === "number" && node.rowSpan > 1) {
                    attrs.rowspan = String(node.rowSpan);
                }

                // width/height attr nếu là số trần
                const w = asNumString((node as any).width);
                const h = asNumString((node as any).height);
                if (w) attrs.width = w;
                if (h) attrs.height = h;

                const open = openTag("td", attrs);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</td>`;
            },
        },
    ],
};
