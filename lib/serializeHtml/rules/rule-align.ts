/*
 * path: lib/serializeHtml/rules/rule-align.ts
 */

// lib/serializeHtml/rules/rule-align.ts
// Align helper dựa trên AlignKit (TextAlignPlugin) của editor.
// Không trực tiếp serialize node; các rule khác sẽ gọi helper này để gắn style phù hợp.
//
// AlignKit cấu hình:
//   nodeKey: 'align', styleKey: 'textAlign',
//   valid: ['start','left','center','right','end','justify']
//   target: headings, p, img, media_embed

import type { SerializeRulePack, ElementAny, AlignValue } from "@/types";

// --- Mapping & helpers -------------------------------------------------------

const VALID_VALUES = new Set([
    "start",
    "left",
    "center",
    "right",
    "end",
    "justify",
] as const);

type AlignToken = typeof VALID_VALUES extends Set<infer U> ? U : never;

function normalizeAlign(value?: unknown): AlignToken | null {
    if (!value) return null;
    const v = String(value).toLowerCase() as AlignToken;
    return (VALID_VALUES as Set<string>).has(v) ? v : null;
}

/** start/end → left/right tuỳ dir (ltr/rtl) */
function logicalToPhysical(align: AlignToken, dir?: "ltr" | "rtl" | "auto"): AlignValue | "justify" {
    if (align === "justify") return "justify";
    if (align === "left" || align === "center" || align === "right") return align as AlignValue;

    const resolvedDir: "ltr" | "rtl" =
        dir === "rtl" ? "rtl" : "ltr"; // treat 'auto' như ltr để an toàn server-side

    if (align === "start") return resolvedDir === "rtl" ? "right" : "left";
    if (align === "end") return resolvedDir === "rtl" ? "left" : "right";

    // fallback an toàn
    return "left";
}

/**
 * Trả về đoạn CSS `text-align:...` nếu node có `align`/`textAlign` hợp lệ.
 * - Ưu tiên `node.align`, sau đó tới `node.textAlign`.
 * - start/end được chuyển sang left/right theo `node.dir`.
 */
export function getAlignCss(node: ElementAny): string | undefined {
    const a = normalizeAlign((node as any).align) ?? normalizeAlign((node as any).textAlign);
    if (!a) return undefined;

    const physical = logicalToPhysical(a, (node as any).dir);
    return `text-align:${physical};`;
}

/**
 * Gộp style align vào style string hiện có.
 * - Nếu style đã có `text-align`, giữ nguyên (không đè).
 */
export function mergeAlignStyle(existingStyle?: string, node?: ElementAny): string | undefined {
    const alignCss = node ? getAlignCss(node) : undefined;
    if (!alignCss && !existingStyle) return undefined;
    if (!alignCss) return existingStyle;

    // nếu existingStyle đã chứa text-align, không chồng lấn
    if (existingStyle && /\btext-align\s*:/.test(existingStyle)) return existingStyle;
    return existingStyle ? `${existingStyle};${alignCss}` : alignCss;
}

/**
 * Một số node (img, media_embed) đôi khi cần align theo cách khác:
 *  - center: có thể muốn display:block + margin-inline:auto (tuỳ ý bạn).
 * Ở đây chỉ trả về gợi ý, rule cụ thể có thể dùng/không tuỳ mục tiêu HTML.
 */
export function getMediaAlignCss(node: ElementAny): string | undefined {
    const a = normalizeAlign((node as any).align) ?? normalizeAlign((node as any).textAlign);
    if (!a) return undefined;

    const physical = logicalToPhysical(a, (node as any).dir);
    if (physical === "center") {
        // Gợi ý an toàn cho media block:
        // - Dùng text-align:center ở container là đủ cho inline/inline-block,
        // - Nhưng nhiều theme muốn block-level centering:
        return "display:block;margin-left:auto;margin-right:auto;";
    }
    // trái/phải thường để theme xử lý (float/inline-start). Không ép ở đây.
    return undefined;
}

// --- Rule pack rỗng: có mặt trong registry nhưng không chiếm quyền serialize ---
export const RuleAlign: SerializeRulePack = {
    name: "align",
    priority: 0, // helper, không can thiệp match
    rules: [
        // intentionally empty: các rule khác sẽ import helper hàm ở trên.
    ],
};
