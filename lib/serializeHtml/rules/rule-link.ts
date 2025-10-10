/*
 * path: lib/serializeHtml/rules/rule-link.ts
 */
// lib/serializeHtml/rules/rule-link.ts
// Serialize hyperlink <a> with strict URL sanitization + safe rel for _blank.
//
// Dựa trên BaseLinkPlugin (Plate), nhưng ở phía serialize ta:
// - Lấy href từ node.url (hoặc node.src fallback).
// - Sanitize theo core (http, https, mailto, tel). Nếu invalid → UNWRAP (giữ children, bỏ thẻ a).
// - target: tôn trọng node.target. Nếu _blank → tự thêm rel="noopener noreferrer" (gộp với node.rel nếu có).
// - title: giữ nếu có. class/id/inline style: cho phép nếu options.allowClassName, style sẽ đến từ các rule khác.
// - Không gọi getLinkAttributes/editor-only API (chỉ runtime serialize).

import type { SerializeRulePack, SlateNode, ElementAny, LinkElement } from "@/types";
import { sanitizeUrl, safeClassName, escapeHtml } from "../serializer-core";

// ---------- type guards ----------
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isLink(n: SlateNode): n is LinkElement {
    return isElement(n) && n.type === "a";
}

// ---------- helpers ----------
function idAttr(node: ElementAny): string | undefined {
    return node.id ? String(node.id) : undefined;
}

function classAttr(node: ElementAny, allow = false): string | undefined {
    if (!allow || !node.className) return undefined;
    const safe = safeClassName(node.className);
    return safe || undefined;
}

function mergeRelForBlank(existing?: string): string {
    // Đảm bảo có "noopener noreferrer", giữ các token cũ (dedupe, normalize space)
    const need = new Set(["noopener", "noreferrer"]);
    const out: string[] = [];
    const seen = new Set<string>();
    const push = (t: string) => {
        const k = t.toLowerCase();
        if (!k) return;
        if (seen.has(k)) return;
        seen.add(k);
        out.push(t);
    };

    if (existing) {
        for (const t of existing.split(/\s+/)) push(t);
    }
    for (const t of need) push(t);
    return out.join(" ").trim();
}

function openTag(tag: string, attrs: Record<string, string | undefined>): string {
    const parts: string[] = [tag];
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === "") continue;
        parts.push(`${k}="${v.replace(/"/g, "&quot;")}"`);
    }
    return `<${parts.join(" ")}>`;
}

// ---------- Rule Pack ----------
export const RuleLink: SerializeRulePack = {
    name: "link",
    priority: 20, // security-sensitive → cao
    rules: [
        {
            name: "a",
            match: isLink,
            serialize: (node, ctx) => {
                // 1) Resolve & sanitize href
                const raw = (node.url ?? (node as any).src ?? "").trim();
                const href = ctx.options.sanitizeUrls ? sanitizeUrl(raw) : raw;

                // Nếu href không hợp lệ → unwrap (giữ nội dung text) thay vì drop
                if (!href) return ctx.serializeChildren(node.children);

                // 2) Build safe attributes
                const attrs: Record<string, string | undefined> = {
                    href,
                };

                // target & rel
                if (node.target) {
                    attrs.target = node.target;
                    if (node.target === "_blank") {
                        attrs.rel = mergeRelForBlank(node.rel);
                    } else if (node.rel) {
                        attrs.rel = node.rel;
                    }
                } else if (node.rel) {
                    attrs.rel = node.rel;
                }

                // title (escaped)
                if (node.title) {
                    attrs.title = String(node.title);
                }

                // id / class
                const id = idAttr(node);
                const cls = classAttr(node, ctx.options.allowClassName);
                if (id) attrs.id = id;
                if (cls) attrs.class = cls;

                // 3) Render
                const open = openTag("a", attrs);
                const inner = ctx.serializeChildren(node.children);

                // Nếu không có children (ví dụ paste plain URL) → hiển thị href
                const content = inner && inner.length ? inner : escapeHtml(href);

                return `${open}${content}</a>`;
            },
        },
    ],
};
