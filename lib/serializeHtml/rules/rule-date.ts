/*
 * path: lib/serializeHtml/rules/rule-date.ts
 */
/*
 * path: lib/serializeHtml/rules/rule-date.ts
 */

import type {
    SerializeRulePack,
    SlateNode,
    ElementAny,
    DateInlineElement,
    Descendant,
} from "@/types";
import { safeClassName } from "../serializer-core";

// ===== guards =====
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isDateInline(n: SlateNode): n is DateInlineElement {
    return isElement(n) && n.type === "date";
}

// ===== helpers =====
function classAttr(node: ElementAny, allow = false): string | undefined {
    if (!allow || !node.className) return undefined;
    const s = safeClassName(node.className);
    return s || undefined;
}
function idAttr(node: ElementAny): string | undefined {
    return node.id ? String(node.id) : undefined;
}
function openTag(tag: string, attrs: Record<string, string | undefined>): string {
    const parts = [tag];
    for (const [k, v] of Object.entries(attrs)) {
        if (!v) continue;
        parts.push(`${k}="${v.replace(/"/g, "&quot;")}"`);
    }
    return `<${parts.join(" ")}>`;
}
function toIsoDatetimeOrNull(s: string | undefined): string | null {
    if (!s) return null;
    const trimmed = String(s).trim();
    // Nếu đã là ISO-like (có 'T') hoặc dạng ngày YYYY-MM-DD thì chấp nhận luôn
    if (/^\d{4}-\d{2}-\d{2}(?:[T ][0-9:.+-Z]+)?$/.test(trimmed)) return trimmed;
    // Thử parse nhanh qua Date
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
        // Giữ nguyên timezone của input là không khả thi, fallback ISO (UTC)
        return d.toISOString();
    }
    return null;
}
function humanDate(s: string): string {
    // Ưu tiên YYYY-MM-DD; nếu parse được thì format YYYY-MM-DD; else trả nguyên
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    return s;
}

// ===== rule pack =====
export const RuleDate: SerializeRulePack = {
    name: "date",
    priority: 0,
    rules: [
        {
            name: "date-inline",
            match: isDateInline,
            serialize: (node, ctx) => {
                const allowClass = ctx.options.allowClassName;
                const id = idAttr(node);
                const cls = classAttr(node, allowClass);

                const inner = ((): string => {
                    const html = ctx.serializeChildren((node as any).children as Descendant[]);
                    if (html && html.replace(/<[^>]*>/g, "").trim() !== "") return html;
                    const raw = String((node as any).date ?? "").trim();
                    if (!raw) return "";
                    return humanDate(raw);
                })();

                const rawDate = (node as any).date as string | undefined;
                const datetime = toIsoDatetimeOrNull(rawDate);

                // Nếu không có date → unwrap children + comment debug
                if (!rawDate) {
                    const content = inner || "";
                    return `<!-- rule-date: missing date -->${content}`;
                }

                const attrs: Record<string, string | undefined> = {};
                if (id) attrs.id = id;
                if (cls) attrs.class = cls;

                // Luôn set title = raw để hover thấy đúng chuỗi
                attrs.title = rawDate;

                if (datetime) {
                    attrs.datetime = datetime;
                } else {
                    // Không set được datetime hợp lệ → giữ raw để debug
                    attrs["data-date-raw"] = rawDate;
                }

                const open = openTag("time", attrs);
                return `${open}${inner}</time>`;
            },
        },
    ],
};
