/*
 * path: lib/serializeHtml/rules/rule-column.ts
 */
// lib/serializeHtml/rules/rule-column.ts
// Columns (flex-based):
// - column_group → <div style="display:flex;..."> [ <div style="flex:0 0 <basis>;max-width:<basis>;">…</div> ]* </div>
// - column       → unwrap (children), layout/width do parent xử lý.
// - Hỗ trợ: node.layout (array %/px/0..1), column.width override, block styles & align trên group/column.

import type {
    SerializeRulePack,
    SlateNode,
    ElementAny,
    ColumnGroupElement,
    ColumnElement,
    Descendant,
} from "@/types";

import { styleString, safeClassName } from "../serializer-core";
import { mergeAlignStyle } from "./rule-align";

// ========== Type guards ==========
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isColumnGroup(n: SlateNode): n is ColumnGroupElement {
    return isElement(n) && n.type === "column_group";
}
function isColumn(n: SlateNode): n is ColumnElement {
    return isElement(n) && n.type === "column";
}

// ========== Utils ==========
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

/** Diễn giải basis:
 * - number ∈ [0,1]  -> tỷ lệ -> v*100%
 * - number khác      -> PHẦN TRĂM -> `${v}%`
 * - string có đơn vị -> giữ nguyên (%, px, rem, …)
 * - string số trần   -> coi là PHẦN TRĂM -> `${s}%`
 */
function basisFromValue(v: number | string): string | undefined {
    if (typeof v === "number" && Number.isFinite(v)) {
        if (v >= 0 && v <= 1) return `${v * 100}%`;
        return `${v}%`;
    }
    const s = String(v ?? "").trim();
    if (!s) return undefined;
    if (/^-?\d+(\.\d+)?[a-z%]+$/i.test(s)) return s; // đã có đơn vị
    if (/^-?\d+(\.\d+)?$/.test(s)) return `${s}%`;   // số trần → %
    return s;
}

function equalShares(n: number): string[] {
    if (n <= 0) return [];
    const pct = 100 / n;
    return Array.from({ length: n }, () => `${pct}%`);
}

// Build style for the group wrapper
function buildGroupStyle(node: ElementAny): string | undefined {
    const style: Record<string, unknown> = {
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "stretch",
    };

    // Typography/colors if any
    if ((node as any).lineHeight != null) style.lineHeight = (node as any).lineHeight;
    if ((node as any).fontSize != null) style.fontSize = (node as any).fontSize;
    if ((node as any).fontFamily != null) style.fontFamily = (node as any).fontFamily;
    if ((node as any).fontWeight != null) style.fontWeight = (node as any).fontWeight;
    if ((node as any).color != null) style.color = (node as any).color;
    if ((node as any).backgroundColor != null) style.backgroundColor = (node as any).backgroundColor;

    // Optional width/height on group
    if ((node as any).width != null) style.width = (node as any).width;
    if ((node as any).height != null) style.height = (node as any).height;

    const base = styleString(style) || undefined;
    return mergeAlignStyle(base, node);
}

// Build style for one column wrapper
function buildColumnWrapperStyle(colNode: ColumnElement | ElementAny, basis: string | undefined): string | undefined {
    const style: Record<string, unknown> = {
        // flex-basis & max-width để cố định chiều rộng cột
        ...(basis ? { flex: `0 0 ${basis}`, maxWidth: basis } : { flex: "1 1 0" }),
    };

    // Cho phép column-level background, padding, v.v. nếu có
    if ((colNode as any).backgroundColor != null) style.backgroundColor = (colNode as any).backgroundColor;
    if ((colNode as any).color != null) style.color = (colNode as any).color;
    if ((colNode as any).lineHeight != null) style.lineHeight = (colNode as any).lineHeight;
    if ((colNode as any).fontSize != null) style.fontSize = (colNode as any).fontSize;
    if ((colNode as any).fontFamily != null) style.fontFamily = (colNode as any).fontFamily;
    if ((colNode as any).fontWeight != null) style.fontWeight = (colNode as any).fontWeight;

    // user-specified height on column nếu có
    if ((colNode as any).height != null) style.height = (colNode as any).height;

    const base = styleString(style) || undefined;
    // align trên column wrapper (ít dùng, nhưng cứ merge nếu có)
    return mergeAlignStyle(base, colNode as ElementAny);
}

function normalizeLayout(group: ColumnGroupElement): string[] {
    const childCount = Array.isArray(group.children) ? group.children.length : 0;
    const layout = Array.isArray(group.layout) ? group.layout : undefined;

    if (!childCount) return [];

    // Ưu tiên layout đúng độ dài
    if (layout && layout.length === childCount) {
        return layout.map((v) => basisFromValue(v as any) || `${100 / childCount}%`);
    }

    // Nếu layout thiếu, ưu tiên column.width; còn lại chia đều
    const result = new Array<string>(childCount);
    for (let i = 0; i < childCount; i++) {
        const child = group.children[i] as ElementAny;
        const fromChild = (child as any)?.width;
        if (fromChild != null) {
            const b = basisFromValue(fromChild as any);
            if (b) { result[i] = b; continue; }
        }
        const lv = layout?.[i];
        if (lv != null) {
            const b = basisFromValue(lv as any);
            if (b) { result[i] = b; continue; }
        }
        result[i] = `${100 / childCount}%`;
    }
    return result;
}

// Render one column wrapper with its inner children
function renderOneColumn(
    colNode: ColumnElement | ElementAny,
    basis: string | undefined,
    ctxSerialize: (nodes?: Descendant[]) => string,
    allowClass: boolean
): string {
    const wrapperAttrs: Record<string, string | undefined> = {};
    const id = idAttr(colNode);
    const cls = classAttr(colNode, allowClass);
    const style = buildColumnWrapperStyle(colNode, basis);

    if (id) wrapperAttrs.id = id;
    if (cls) wrapperAttrs.class = cls;
    if (style) wrapperAttrs.style = style;

    const open = openTag("div", wrapperAttrs);
    const inner = ctxSerialize((colNode as any).children);
    return `${open}${inner}</div>`;
}

// ========== Rule Pack ==========
export const RuleColumn: SerializeRulePack = {
    name: "column",
    priority: 100, // cao để chạy trước basic-blocks & fallback
    rules: [
        // Parent wrapper: column_group
        {
            name: "column_group",
            match: isColumnGroup,
            serialize: (node, ctx) => {
                try {
                    const groupAttrs: Record<string, string | undefined> = {};
                    const id = idAttr(node);
                    const cls = classAttr(node, ctx.options.allowClassName);
                    const style = buildGroupStyle(node);

                    if (id) groupAttrs.id = id;
                    if (cls) groupAttrs.class = cls;
                    if (style) groupAttrs.style = style;

                    const open = openTag("div", groupAttrs);

                    const bases = normalizeLayout(node);
                    const kids = (node.children || []) as ElementAny[];
                    const chunks: string[] = [];

                    for (let i = 0; i < kids.length; i++) {
                        const col = kids[i];
                        const htmlCol = renderOneColumn(
                            col as ColumnElement,
                            bases[i],
                            // giữ binding của ctx
                            (nodes) => ctx.serializeChildren(nodes),
                            ctx.options.allowClassName
                        );
                        chunks.push(htmlCol);
                    }
                    const html = `${open}${chunks.join("")}</div>`;
                    return html;
                } catch (err) {
                    // an toàn: unwrap để không chặn render
                    return ctx.serializeChildren(node.children);
                }
            },
        },

        // Child: column → unwrap (để parent quyết định layout)
        {
            name: "column-unwrap",
            match: isColumn,
            serialize: (node, ctx) => {
                return ctx.serializeChildren(node.children);
            },
        },
    ],
};
