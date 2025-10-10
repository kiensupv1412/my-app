// rules/rule-fallback.ts
// Fallback cuối cùng: nếu không rule nào match → drop node & log thông tin để debug.

import type { SerializeRulePack, SlateNode, ElementAny, SerializerCtx } from "@/types";

function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}

// Ghi log gọn, tránh gây ồn ào nếu serialize nhiều.
// Có thể sau này đổi sang gửi về telemetry hoặc collector tuỳ bạn.
function logFallback(node: ElementAny, ctx: SerializerCtx) {
    try {
        const previewText =
            Array.isArray(node.children)
                ? node.children
                    .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
                    .join(" ")
                    .slice(0, 120)
                : "";

        // eslint-disable-next-line no-console
        console.warn(
            `[serializeHtml:fallback] dropped unknown node`,
            {
                type: node.type,
                id: node.id,
                keys: Object.keys(node),
                previewText,
                options: ctx.options, // tiện đối chiếu config hiện tại
            }
        );
    } catch {
        // ignore logging errors
    }
}

export const RuleFallback: SerializeRulePack = {
    name: "fallback",
    priority: -1000, // thấp nhất: chạy sau tất cả rule khác
    rules: [
        {
            name: "fallback-drop-unknown-element",
            match: (node: SlateNode): node is ElementAny => isElement(node),
            serialize: (node, ctx) => {
                logFallback(node, ctx);
                // XÓA node luôn, không unwrap children
                return "";
            },
        },
    ],
};
