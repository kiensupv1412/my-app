/*
 * path: lib/serializeHtml/rules/rule-list.ts
 *
 * Cơ chế:
 * - packListRuns(nodes): prepass -> gom các “paragraph-as-list” liên tiếp thành 1 node synthetic __list_group__
 *   với cây UL/OL lồng nhau theo indent. Nhảy số dùng li.value. “todo” -> UL list-none + checkbox.
 * - RuleListGroup: serialize __list_group__ -> HTML SEO/a11y chuẩn.
 * - RuleList (cũ) vẫn giữ làm fallback khi bạn chưa bật prepass.
 */

import type {
    SerializeRulePack,
    SlateNode,
    ElementAny,
    UlElement,
    OlElement,
    LiElement,
    ParagraphElement,
    HeadingElement,
    Descendant,
} from "@/types";

import { styleString, safeClassName } from "../serializer-core";
import { mergeAlignStyle } from "./rule-align";

/* ===================== Guards ===================== */
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isUl(n: SlateNode): n is UlElement { return isElement(n) && n.type === "ul"; }
function isOl(n: SlateNode): n is OlElement { return isElement(n) && n.type === "ol"; }
function isLi(n: SlateNode): n is LiElement { return isElement(n) && n.type === "li"; }
function isActionItem(n: SlateNode): n is ElementAny { return isElement(n) && n.type === "action_item"; }
function isLic(n: SlateNode): n is ElementAny { return isElement(n) && n.type === "lic"; }

const LIST_TARGET_TYPES = new Set(["p", "blockquote", "code_block", "toggle", "h1", "h2", "h3", "h4", "h5", "h6"]);
function isListParagraph(n: SlateNode): n is ParagraphElement | HeadingElement | ElementAny {
    if (!isElement(n)) return false;
    if (!LIST_TARGET_TYPES.has(n.type)) return false;
    return !!(n as any).listStyleType;
}

/* ===================== Helpers ===================== */
const INDENT_EM = 1.5;

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
function numberOrUndefined(v: unknown): number | undefined {
    const n = typeof v === "number" ? v : Number(String(v));
    return Number.isFinite(n) ? n : undefined;
}
function styleAppendOnce(existing: string | undefined, key: string, value: string): string {
    const k = `${key}:`;
    if (existing && existing.includes(k)) return existing;
    const seg = `${key}:${value};`;
    return existing ? `${existing};${seg}`.replace(/;;+/g, ";") : seg;
}

type ListKind = "ol" | "ul" | "todo";

function classifyKind(listStyleType: unknown): { kind: ListKind; olType?: "1" | "a" | "A" | "i" | "I"; cssListStyleType: string } {
    const raw = String(listStyleType || "").toLowerCase();
    if (raw === "todo") return { kind: "todo", cssListStyleType: "none" };

    if (
        raw === "decimal" ||
        raw.startsWith("decimal") ||
        raw.includes("roman") ||
        raw.includes("alpha") ||
        raw.includes("greek")
    ) {
        let olType: "1" | "a" | "A" | "i" | "I" | undefined;
        if (raw.includes("lower-alpha")) olType = "a";
        else if (raw.includes("upper-alpha")) olType = "A";
        else if (raw.includes("lower-roman")) olType = "i";
        else if (raw.includes("upper-roman")) olType = "I";
        else olType = "1";
        return { kind: "ol", olType, cssListStyleType: raw || "decimal" };
    }
    return { kind: "ul", cssListStyleType: raw || "disc" };
}

function buildContainerStyle(node: ElementAny): string | undefined {
    const style: Record<string, unknown> = {};
    const indent = numberOrUndefined((node as any).indent);
    if (indent && indent > 0) style.marginLeft = `${indent * INDENT_EM}em`;
    if ((node as any).lineHeight != null) style.lineHeight = (node as any).lineHeight;
    if ((node as any).fontSize != null) style.fontSize = (node as any).fontSize;
    if ((node as any).fontFamily != null) style.fontFamily = (node as any).fontFamily;
    if ((node as any).fontWeight != null) style.fontWeight = (node as any).fontWeight;
    if ((node as any).color != null) style.color = (node as any).color;
    if ((node as any).backgroundColor != null) style.backgroundColor = (node as any).backgroundColor;

    const base = styleString(style) || undefined;
    return mergeAlignStyle(base, node);
}

function buildLiStyle(node: ElementAny): string | undefined {
    const style: Record<string, unknown> = {};
    if ((node as any).lineHeight != null) style.lineHeight = (node as any).lineHeight;
    if ((node as any).fontSize != null) style.fontSize = (node as any).fontSize;
    if ((node as any).fontFamily != null) style.fontFamily = (node as any).fontFamily;
    if ((node as any).fontWeight != null) style.fontWeight = (node as any).fontWeight;
    if ((node as any).color != null) style.color = (node as any).color;
    if ((node as any).backgroundColor != null) style.backgroundColor = (node as any).backgroundColor;
    const base = styleString(style) || undefined;
    return mergeAlignStyle(base, node);
}
function renderCheckbox(checked?: boolean): string {
    if (checked == null) return "";
    return `<input type="checkbox"${checked ? " checked" : ""} disabled aria-hidden="true"/>`;
}

/* ============================================================
   PREPASS: packListRuns
   - Biến các node paragraph-as-list liên tiếp thành 1 node synthetic:
     { type: "__list_group__", children: [ ...structured list nodes... ] }
   - Trong cấu trúc con, chúng ta tạo node “ảo” dạng:
     { _tag: "ol"|"ul", _attrs: {...}, _children: [ li/sublist ] }
     { _tag: "li", _attrs: {...}, _children: [ content | sublist ] }
   ============================================================ */

type ListNode = {
    _tag: "ol" | "ul";
    _attrs: Record<string, string | undefined>;
    _children: Array<ListItemNode>;
};
type ListItemNode = {
    _tag: "li";
    _attrs: Record<string, string | undefined>;
    _children: Array<string | ListNode>; // inner HTML string or nested list
};

type ListGroupNode = {
    type: "__list_group__";
    // để style/class kế thừa từ mục đầu tiên của run cấp tương ứng
    attrs?: Record<string, string | undefined>;
    tree: Array<ListNode>; // có thể nhiều root list nếu run bắt đầu bằng nhiều indent khác nhau? (hiếm) — vẫn hỗ trợ
};

function createList(kind: ListKind, cssType: string, olType?: string): ListNode {
    const _attrs: Record<string, string | undefined> = {};
    // css base
    if (kind === "todo") {
        _attrs.style = styleAppendOnce(undefined, "list-style-type", "none");
    } else {
        _attrs.style = styleAppendOnce(undefined, "list-style-type", cssType);
        if (kind === "ol" && olType && olType !== "1") _attrs.type = olType;
    }
    return { _tag: kind === "ol" ? "ol" : "ul", _attrs, _children: [] };
}

function pushLi(list: ListNode, node: ElementAny, valueOverride?: number): ListItemNode {
    const liAttrs: Record<string, string | undefined> = {};
    const liId = idAttr(node);
    const liCls = classAttr(node, true);
    const liStyle = buildLiStyle(node);
    if (liId) liAttrs.id = liId;
    if (liCls) liAttrs.class = liCls;
    if (liStyle) liAttrs.style = liStyle;
    if (typeof (node as any).checked === "boolean") {
        liAttrs["data-checked"] = (node as any).checked ? "true" : "false";
    }
    if (typeof valueOverride === "number" && Number.isFinite(valueOverride)) {
        liAttrs.value = String(valueOverride);
    }
    const li: ListItemNode = { _tag: "li", _attrs: liAttrs, _children: [] };
    list._children.push(li);
    return li;
}

/** packListRuns: biến mảng nodes thành mảng mới, trong đó các đoạn list được pack */
export function packListRuns(nodes: Descendant[]): Descendant[] {
    const out: Descendant[] = [];
    let i = 0;

    while (i < nodes.length) {
        const n = nodes[i];

        if (!isListParagraph(n)) {
            out.push(n);
            i++;
            continue;
        }

        // Bắt đầu một run list
        const startIdx = i;
        const run: ElementAny[] = [];
        while (i < nodes.length && isListParagraph(nodes[i])) {
            run.push(nodes[i] as ElementAny);
            i++;
        }

        // Xây cây lồng theo indent
        const roots: ListNode[] = [];
        type StackEntry = { list: ListNode; indent: number; kind: ListKind };
        const stack: StackEntry[] = [];

        function currentLi(): ListItemNode | undefined {
            const top = stack[stack.length - 1];
            const list = top?.list;
            if (!list || list._children.length === 0) return undefined;
            return list._children[list._children.length - 1];
        }

        for (let k = 0; k < run.length; k++) {
            const node = run[k];
            const indent = numberOrUndefined((node as any).indent) || 0;
            const { kind, olType, cssListStyleType } = classifyKind((node as any).listStyleType);

            // Điều chỉnh stack theo indent & kind
            while (stack.length > 0 && (stack[stack.length - 1].indent > indent)) {
                stack.pop();
            }
            // Nếu cùng indent nhưng khác kind → đóng mức đó
            if (stack.length > 0 && stack[stack.length - 1].indent === indent && stack[stack.length - 1].kind !== kind) {
                stack.pop();
            }

            // Mở list nếu thiếu
            if (stack.length === 0 || stack[stack.length - 1].indent < indent || stack[stack.length - 1].kind !== kind) {
                const lst = createList(kind, cssListStyleType, olType);
                // copy margin-left từ indent mức này (áp cho container list)
                if (indent > 0) {
                    lst._attrs.style = styleAppendOnce(lst._attrs.style, "margin-left", `${indent * INDENT_EM}em`);
                }
                // Nếu không có stack → root
                if (stack.length === 0) roots.push(lst);
                else {
                    // lồng vào li gần nhất của mức trên
                    const liParent = currentLi();
                    if (liParent) liParent._children.push(lst);
                    else roots.push(lst); // fallback an toàn
                }
                stack.push({ list: lst, indent, kind });
            }

            // Tính giá trị li.value (để xử lý listStart nhảy số giữa chừng)
            let valueOverride: number | undefined;
            const startVal = numberOrUndefined((node as any).listStart);
            if (startVal && startVal > 1) valueOverride = startVal;

            const top = stack[stack.length - 1].list;
            const li = pushLi(top, node, valueOverride);

            // Thêm nội dung text của node vào li (giữ nguyên inline/children)
            (li._children as any[]).push({ __htmlFromNode: node } as any);
        }

        // Tạo synthetic group node
        const group: ListGroupNode = { type: "__list_group__", tree: roots };
        // copy attributes/styling từ mục đầu tiên nếu cần (không bắt buộc)
        out.push(group as any);
    }

    return out;
}

/* ===================== Serializer cho __list_group__ ===================== */

function renderListTree(tree: Array<ListNode>, ctxSerialize: (nodes?: Descendant[]) => string, allowClass: boolean): string {
    const buf: string[] = [];

    function renderList(lst: ListNode): string {
        // Mở tag list
        const open = openTag(lst._tag, lst._attrs);
        const items = lst._children.map(renderLi).join("");
        return `${open}${items}</${lst._tag}>`;
    }

    function renderLi(li: ListItemNode): string {
        const open = openTag("li", li._attrs);
        const inner = li._children.map((c) => {
            if (typeof c === "string") return c;
            // handle special marker for original node content
            if ((c as any).__htmlFromNode) {
                const node = (c as any).__htmlFromNode as ElementAny;
                const checkbox = typeof (node as any).checked === "boolean" ? renderCheckbox((node as any).checked) : "";
                return checkbox + ctxSerialize(node.children);
            }
            // nested list
            return renderList(c as ListNode);
        }).join("");
        return `${open}${inner}</li>`;
    }

    for (const r of tree) buf.push(renderList(r));
    return buf.join("");
}

function isListGroup(n: SlateNode): n is any {
    return (n as any)?.type === "__list_group__" && Array.isArray((n as any).tree);
}

export const RuleListGroup: SerializeRulePack = {
    name: "list-group",
    priority: 100, // chạy TRƯỚC RuleList thường
    rules: [
        {
            name: "__list_group__",
            match: isListGroup,
            serialize: (node: any, ctx) => {
                return renderListTree(node.tree, (nodes) => ctx.serializeChildren(nodes), ctx.options.allowClassName);
            },
        },
    ],
};

/* ===================== Rule cũ (fallback per-node) ===================== */

function buildContainerStyleLegacy(node: ElementAny): string | undefined {
    const style: Record<string, unknown> = {};
    const indent = numberOrUndefined((node as any).indent);
    if (indent && indent > 0) style.marginLeft = `${indent * INDENT_EM}em`;
    if ((node as any).lineHeight != null) style.lineHeight = (node as any).lineHeight;
    if ((node as any).fontSize != null) style.fontSize = (node as any).fontSize;
    if ((node as any).fontFamily != null) style.fontFamily = (node as any).fontFamily;
    if ((node as any).fontWeight != null) style.fontWeight = (node as any).fontWeight;
    if ((node as any).color != null) style.color = (node as any).color;
    if ((node as any).backgroundColor != null) style.backgroundColor = (node as any).backgroundColor;
    const base = styleString(style) || undefined;
    return mergeAlignStyle(base, node);
}

export const RuleList: SerializeRulePack = {
    name: "list",
    priority: 0,
    rules: [
        // fallback per-node: paragraph-as-list
        {
            name: "paragraph-as-list-item",
            match: isListParagraph,
            serialize: (node, ctx) => {
                const { kind, olType, cssListStyleType } = classifyKind((node as any).listStyleType);

                // container attrs (không gán id để tránh trùng với li)
                const contAttrs: Record<string, string | undefined> = {};
                const contCls = classAttr(node, ctx.options.allowClassName);
                if (contCls) contAttrs.class = contCls;

                let contStyle = buildContainerStyleLegacy(node);
                contStyle = styleAppendOnce(contStyle, "list-style-type", cssListStyleType);
                contAttrs.style = contStyle;

                if (kind === "ol" && olType) contAttrs.type = olType;
                const start = numberOrUndefined((node as any).listStart);
                if (kind === "ol" && start && start > 1) contAttrs.start = String(start);

                const liAttrs: Record<string, string | undefined> = {};
                const liStyle = buildLiStyle(node);
                const liId = idAttr(node);
                const liCls = classAttr(node, ctx.options.allowClassName);
                if (liId) liAttrs.id = liId;
                if (liCls) liAttrs.class = liCls;
                if (liStyle) liAttrs.style = liStyle;
                if (typeof (node as any).checked === "boolean") {
                    liAttrs["data-checked"] = (node as any).checked ? "true" : "false";
                }

                const contOpen = openTag(kind === "ol" ? "ol" : "ul", contAttrs);
                const liOpen = openTag("li", liAttrs);
                const checkbox = kind === "todo" ? renderCheckbox((node as any).checked) : renderCheckbox((node as any).checked);
                const inner = ctx.serializeChildren(node.children);
                return `${contOpen}${liOpen}${checkbox}${inner}</li></${kind === "ol" ? "ol" : "ul"}>`;
            },
        },

        // Chuẩn: <ul>
        {
            name: "ul",
            match: isUl,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const id = idAttr(node);
                const cls = classAttr(node, ctx.options.allowClassName);
                let style = buildContainerStyleLegacy(node);
                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if ((node as any).listStyleType) {
                    style = styleAppendOnce(style, "list-style-type", String((node as any).listStyleType));
                }
                if (style) attrs.style = style;

                const open = openTag("ul", attrs);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</ul>`;
            },
        },

        // Chuẩn: <ol>
        {
            name: "ol",
            match: isOl,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const id = idAttr(node);
                const cls = classAttr(node, ctx.options.allowClassName);
                let style = buildContainerStyleLegacy(node);
                if (id) attrs.id = id;
                if (cls) attrs.class = cls;

                if ((node as any).listStyleType) {
                    const c = classifyKind((node as any).listStyleType);
                    if (c.kind === "ol" && c.olType) attrs.type = c.olType;
                    style = styleAppendOnce(style, "list-style-type", c.cssListStyleType);
                }
                const start = numberOrUndefined((node as any).listStart);
                if (start && start > 1) attrs.start = String(start);

                if (style) attrs.style = style;

                const open = openTag("ol", attrs);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${inner}</ol>`;
            },
        },

        // <li>
        {
            name: "li",
            match: isLi,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const id = idAttr(node);
                const cls = classAttr(node, ctx.options.allowClassName);
                const style = buildLiStyle(node);
                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if (style) attrs.style = style;
                if (typeof node.checked === "boolean") {
                    attrs["data-checked"] = node.checked ? "true" : "false";
                }

                const open = openTag("li", attrs);
                const checkbox = renderCheckbox(node.checked);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${checkbox}${inner}</li>`;
            },
        },

        // action_item -> li
        {
            name: "action_item",
            match: isActionItem,
            serialize: (node, ctx) => {
                const attrs: Record<string, string | undefined> = {};
                const id = idAttr(node);
                const cls = classAttr(node, ctx.options.allowClassName);
                const style = buildLiStyle(node);
                if (id) attrs.id = id;
                if (cls) attrs.class = cls;
                if (style) attrs.style = style;
                if (typeof (node as any).checked === "boolean") {
                    attrs["data-checked"] = (node as any).checked ? "true" : "false";
                }

                const open = openTag("li", attrs);
                const checkbox = renderCheckbox((node as any).checked);
                const inner = ctx.serializeChildren(node.children);
                return `${open}${checkbox}${inner}</li>`;
            },
        },

        // lic unwrap
        {
            name: "lic-unwrap",
            match: isLic,
            serialize: (node, ctx) => ctx.serializeChildren(node.children),
        },
    ],
};
