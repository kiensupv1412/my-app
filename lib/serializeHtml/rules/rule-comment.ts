/*
 * Xóa toàn bộ node mang cờ comment/suggestion (không render gì).
 * Giữ tên file/rule cũ để không phải đổi import, nhưng mở rộng logic.
 */

import type { SerializeRulePack, SlateNode, ElementAny, Descendant, TextLeaf } from "@/types";

function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}

function isLeaf(n: SlateNode): n is TextLeaf {
    return (n as any)?.type === undefined && typeof (n as any)?.text === "string";
}

function hasAnnotationFlag(obj: any): boolean {
    if (!obj || typeof obj !== "object") return false;

    // comment flags
    if (obj.comment === true) return true;
    for (const k of Object.keys(obj)) {
        if (k.startsWith("comment_") && obj[k] === true) return true;
    }

    // suggestion flags
    if (obj.suggestion === true) return true;
    for (const k of Object.keys(obj)) {
        if (k.startsWith("suggestion_") && obj[k]) return true; // có thể là object metadata
    }

    return false;
}

export const RuleComment: SerializeRulePack = {
    name: "annotation-drop",
    priority: 1000, // rất cao để chặn trước mọi rule khác
    rules: [
        // type = 'comment' hoặc 'suggestion' → drop
        {
            name: "annotation-type-drop",
            match: (n) =>
                isElement(n) &&
                ((n as ElementAny).type === "comment" || (n as ElementAny).type === "suggestion"),
            serialize: () => "",
        },
        // bất kỳ element có cờ comment/suggestion → drop
        {
            name: "annotation-flagged-element-drop",
            match: (n) => isElement(n) && hasAnnotationFlag(n),
            serialize: () => "",
        },
    ],
};

/*
 * Prepass: Drop toàn bộ leaf/element liên quan comment & suggestion.
 * Giữ tên file cũ để không đổi import; thêm hàm dropAnnotationsPrepass.
 */
/** (Mới) Drop tất cả comment + suggestion. */
export function dropAnnotationsPrepass(nodes: Descendant[]): Descendant[] {
    const out: Descendant[] = [];
    for (const n of nodes) {
        const cleaned = cleanNode(n);
        if (cleaned == null) continue;           // drop
        if (Array.isArray(cleaned)) out.push(...cleaned); // unwrap list (hiếm khi dùng)
        else out.push(cleaned);
    }
    return out;
}

/** (Cũ) Giữ lại để không vỡ call-site; giờ hành vi = dropAnnotationsPrepass */
export const dropCommentsPrepass = dropAnnotationsPrepass;

function cleanNode(n: Descendant): Descendant | Descendant[] | null {
    // Leaf có cờ → drop
    if (isLeaf(n)) {
        return hasAnnotationFlag(n) ? null : n;
    }

    // Element type=comment/suggestion hoặc có cờ → drop nguyên node
    if (isElement(n)) {
        if ((n as any).type === "comment" || (n as any).type === "suggestion" || hasAnnotationFlag(n)) {
            return null;
        }

        // Element bình thường → làm sạch children
        const children = Array.isArray(n.children) ? n.children : [];
        const nextKids: Descendant[] = [];
        for (const c of children) {
            const cleaned = cleanNode(c as Descendant);
            if (cleaned == null) continue;
            if (Array.isArray(cleaned)) nextKids.push(...cleaned);
            else nextKids.push(cleaned);
        }

        // Trống → drop để tránh thẻ rỗng
        if (nextKids.length === 0) return null;

        return { ...(n as any), children: nextKids } as Descendant;
    }

    return null; // unknown → drop
}
