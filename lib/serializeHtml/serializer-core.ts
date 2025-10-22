// core/serializer-core.ts — engine serialize cốt lõi + tiện ích
import type {
    Descendant,
    SlateNode,
    TextLeaf,
    ElementAny,
    SerializeOptions,
    SerializerCtx,
    SerializeRule,
    SerializeRulePack,
} from "@/types";

// =================== Mặc định & Hợp đồng ===================
export type CreateSerializerArgs = {
    plugins?: SerializeRulePack[]; // "plugins" thực chất là pack rule (không dùng plugin/kit trong tên file)
    options?: SerializeOptions;
};

export const defaultOptions: Required<SerializeOptions> = {
    softBreakAsBr: true,
    sanitizeUrls: true,
    allowClassName: false,
    onUnknown: () => "unwrap",
};

// =================== Utils: HTML & CSS ===================
const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

/** escapeHtml
 * Thoát ký tự đặc biệt để an toàn khi đưa text vào HTML (&, <, >, ", ').
 */
export function escapeHtml(text: string): string {
    if (!/[&<>"']/.test(text)) return text;
    return text.replace(/[&<>"']/g, (m) => htmlEscapeMap[m]);
}

/** toKebab
 * Chuyển camelCase → kebab-case cho tên thuộc tính CSS inline.
 */
function toKebab(k: string): string {
    return k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** safeCssValue
 * Loại bỏ giá trị CSS nguy hiểm (expression(), javascript:, url()).
 * Trả null nếu không an toàn, ngược lại trả chuỗi đã trim.
 */
function safeCssValue(v: unknown): string | null {
    if (v == null) return null;
    const s = String(v).trim();
    const lower = s.toLowerCase();
    if (lower.includes("expression(") || lower.startsWith("javascript:")) return null;
    if (lower.includes("url(")) return null; // chặn url() mặc định
    return s;
}

/** styleString
 * Nhận object style camelCase và trả về chuỗi CSS inline; loại bỏ giá trị nguy hiểm.
 * Trả undefined nếu không có thuộc tính hợp lệ.
 */
export function styleString(style?: Record<string, unknown>): string | undefined {
    if (!style) return undefined;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(style)) {
        const val = safeCssValue(v);
        if (val) parts.push(`${toKebab(k)}:${val}`);
    }
    return parts.length ? parts.join(";") : undefined;
}

/** sanitizeUrl
 * Làm sạch URL theo scheme cho phép (http, https, mailto, tel).
 * Cho phép URL tương đối; có thể bật data:image/* qua allowDataImage.
 * Trả null nếu URL không hợp lệ/không an toàn.
 */
const DEFAULT_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
export function sanitizeUrl(href: string, allowDataImage = false): string | null {
    try {
        if (allowDataImage && href.startsWith("data:image/")) return href;
        // URL tương đối → cho phép
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return href;
        const u = new URL(href);
        if (DEFAULT_SCHEMES.has(u.protocol)) return href;
        return null;
    } catch {
        return null;
    }
}

/** safeClassName
 * Làm sạch className: chỉ giữ a-zA-Z0-9, -, _, khoảng trắng; gom nhiều space thành 1.
 * Trả null nếu rỗng sau khi làm sạch.
 */
export function safeClassName(className?: string | null): string | null {
    if (!className) return null;
    const cleaned = className.replace(/[^a-zA-Z0-9\-_ ]+/g, " ").trim().replace(/\s+/g, " ");
    return cleaned || null;
}

// =================== Type guards ===================
/** isTextLeaf
 * Kiểm tra node là TextLeaf (không có type, có thuộc tính text là string).
 */
export function isTextLeaf(n: SlateNode): n is TextLeaf {
    return (n as any).type === undefined && typeof (n as any).text === "string";
}

/** isElement
 * Kiểm tra node là Element (có thuộc tính type).
 */
export function isElement(n: SlateNode): n is ElementAny {
    return (n as any).type !== undefined;
}

// =================== Registry & Resolve rule ===================
type ResolvedRule = SerializeRule & { __prio: number; __pack?: string };

/** buildRegistry
 * Gộp các pack rule thành danh sách rule đã gán độ ưu tiên; sort ưu tiên cao trước.
 */
function buildRegistry(packs: SerializeRulePack[] = []): ResolvedRule[] {
    const out: ResolvedRule[] = [];
    for (const p of packs) {
        const prio = p.priority ?? 0;
        for (const r of p.rules) {
            out.push(Object.assign({ __prio: prio, __pack: p.name }, r));
        }
    }
    // ưu tiên cao đứng trước; sort ổn định trong runtime hiện đại
    out.sort((a, b) => (b.__prio - a.__prio));
    return out;
}

/** resolveRule
 * Duyệt registry và chọn rule đầu tiên match với node (bắt lỗi match để tiếp tục).
 */
function resolveRule(node: SlateNode, registry: ResolvedRule[]): ResolvedRule | undefined {
    for (const r of registry) {
        try {
            if (r.match(node)) return r;
        } catch {
            // bỏ qua lỗi trong match và tiếp tục
        }
    }
    return undefined;
}

// =================== Serializer cho TextLeaf ===================
const INLINE_STYLE_KEYS = new Set([
    "color",
    "backgroundColor",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "lineHeight",
    "textAlign"
]);

/** serializeTextLeaf
 * Render 1 TextLeaf:
 *  - escape text
 *  - chuyển xuống dòng mềm thành <br/>
 *  - bọc các mark ngữ nghĩa (strong, em, u, s, code, mark, kbd, sub/sup)
 *  - áp style inline và className (nếu cho phép)
 */
function serializeTextLeaf(leaf: TextLeaf, opts: Required<SerializeOptions>): string {
    // 1) escape text
    let text = escapeHtml(leaf.text ?? "");

    // 2) xuống dòng mềm
    if (opts.softBreakAsBr && text.includes("\n")) {
        text = text
            .split("\n")
            .map((t) => (t === "" ? "<br/>" : t))
            .join("<br/>");
    }

    // 3) các mark ngữ nghĩa (thứ tự xác định)
    const wrappers: ((s: string) => string)[] = [];
    if (leaf.bold) wrappers.push((s) => `<strong>${s}</strong>`);
    if (leaf.italic) wrappers.push((s) => `<em>${s}</em>`);
    if (leaf.underline) wrappers.push((s) => `<u>${s}</u>`);
    if (leaf.strikethrough) wrappers.push((s) => `<s>${s}</s>`);
    if (leaf.code) wrappers.push((s) => `<code>${s}</code>`);
    if (leaf.highlight) wrappers.push((s) => `<mark>${s}</mark>`);
    if (leaf.kbd) wrappers.push((s) => `<kbd>${s}</kbd>`);

    const sub = leaf.sub || leaf.subscript;
    const sup = leaf.sup || leaf.superscript;
    if (sub) wrappers.push((s) => `<sub>${s}</sub>`);
    if (sup) wrappers.push((s) => `<sup>${s}</sup>`);

    // 4) style inline đưa vào <span style="">
    const styleObj: Record<string, unknown> = {};
    for (const k of INLINE_STYLE_KEYS) {
        const val = (leaf as any)[k];
        if (val != null) styleObj[k] = val;
    }
    const style = styleString(styleObj);

    // 5) className (tùy chọn, đã làm sạch)
    let classAttr = "";
    if (opts.allowClassName && leaf.className) {
        const safe = safeClassName(leaf.className);
        if (safe) classAttr = ` class="${safe}"`;
    }

    let out = text;
    for (const wrap of wrappers) out = wrap(out);

    if (style) out = `<span style="${style}"${classAttr}>${out}</span>`;
    else if (classAttr) out = `<span${classAttr}>${out}</span>`;

    return out;
}

// =================== Gọi rule an toàn ===================
/** safeCallSerialize
 * Gọi rule.serialize; nếu lỗi thì “unwrap” children để không làm vỡ toàn bộ output.
 */
function safeCallSerialize(rule: ResolvedRule, node: ElementAny, ctx: SerializerCtx): string {
    try {
        return rule.serialize(node as any, ctx);
    } catch (e) {
        // phòng thủ: nếu serialize lỗi, unwrap children thay vì crash
        return ctx.serializeChildren(node.children);
    }
}

// =================== Public API ===================
/** createSerializer
 * Tạo engine serialize:
 *  - build registry từ các pack rule
 *  - cung cấp ctx.serializeChildren để duyệt cây Slate
 *  - trả serialize(nodes) xuất HTML + utils cho rule dùng chung
 */
export function createSerializer({ plugins = [], options }: CreateSerializerArgs) {
    const opts: Required<SerializeOptions> = { ...defaultOptions, ...(options ?? {}) };
    const registry = buildRegistry(plugins);

    const ctx: SerializerCtx = {
        options: opts,

        /** serializeChildren
         * Duyệt mảng node con:
         *  - TextLeaf → render qua serializeTextLeaf
         *  - Element → tìm rule; không có rule thì áp policy onUnknown (drop/unwrap)
         *  - Kết quả nối chuỗi HTML
         */
        serializeChildren(nodes?: Descendant[]) {
            if (!nodes || nodes.length === 0) return "";
            const out: string[] = [];
            for (const n of nodes) {
                if (isTextLeaf(n)) {
                    out.push(serializeTextLeaf(n, opts));
                    continue;
                }
                if (isElement(n)) {
                    const rule = resolveRule(n, registry);
                    if (rule) {
                        out.push(safeCallSerialize(rule, n, this));
                    } else {
                        const policy = opts.onUnknown(n);
                        if (policy === "drop") continue;
                        out.push(this.serializeChildren(n.children));
                    }
                    continue;
                }
                // nhánh không xảy ra: fallback rỗng
                out.push("");
            }
            return out.join("");
        },
    };

    /** serialize
     * Render toàn bộ cây Slate sang HTML bằng ctx.serializeChildren.
     * (Hậu xử lý như stripIdsFromHtml nên thực hiện bên ngoài nếu cần.)
     */
    function serialize(nodes: Descendant[] = []): string {
        return ctx.serializeChildren(nodes);
    }

    return {
        serialize,
        ctx,
        options: opts,
        // xuất kèm tiện ích cho file rule sử dụng
        utils: {
            escapeHtml,
            styleString,
            sanitizeUrl,
            safeClassName,
            isTextLeaf,
            isElement,
        },
    };
}

// =================== Hậu xử lý HTML ===================
// Xoá mọi thuộc tính id="..." / id='...' / id=trần trong các thẻ HTML
export function stripIdsFromHtml(html: string): string {
    // chỉ nhắm vào thuộc tính id trong tag; không đụng tới nội dung text
    // ví dụ: <p id="x">, <h2   id='y' >, <div id=z>
    return html.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}
