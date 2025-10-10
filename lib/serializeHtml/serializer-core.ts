// core/serializer-core.ts — core serializer engine + utilities
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

// =================== Defaults & Contracts ===================
export type CreateSerializerArgs = {
    plugins?: SerializeRulePack[]; // gọi là "plugins" nhưng là pack rule logic (không dùng plugin/kit trong tên file)
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

export function escapeHtml(text: string): string {
    if (!/[&<>"']/.test(text)) return text;
    return text.replace(/[&<>"']/g, (m) => htmlEscapeMap[m]);
}

function toKebab(k: string): string {
    return k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

// reject suspicious CSS values
function safeCssValue(v: unknown): string | null {
    if (v == null) return null;
    const s = String(v).trim();
    const lower = s.toLowerCase();
    if (lower.includes("expression(") || lower.startsWith("javascript:")) return null;
    if (lower.includes("url(")) return null; // chặn url() mặc định
    return s;
}

/** Convert a record of camelCase style to inline CSS string; reject dangerous values. */
export function styleString(style?: Record<string, unknown>): string | undefined {
    if (!style) return undefined;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(style)) {
        const val = safeCssValue(v);
        if (val) parts.push(`${toKebab(k)}:${val}`);
    }
    return parts.length ? parts.join(";") : undefined;
}

/** Sanitize URL by scheme; allow relative; allow data:image/* if requested. */
const DEFAULT_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
export function sanitizeUrl(href: string, allowDataImage = false): string | null {
    try {
        if (allowDataImage && href.startsWith("data:image/")) return href;
        // relative URL → allow
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) return href;
        const u = new URL(href);
        if (DEFAULT_SCHEMES.has(u.protocol)) return href;
        return null;
    } catch {
        return null;
    }
}

/** Clean className to alphanum/-/_/space only. */
export function safeClassName(className?: string | null): string | null {
    if (!className) return null;
    const cleaned = className.replace(/[^a-zA-Z0-9\-_ ]+/g, " ").trim().replace(/\s+/g, " ");
    return cleaned || null;
}

// =================== Type guards ===================
export function isTextLeaf(n: SlateNode): n is TextLeaf {
    return (n as any).type === undefined && typeof (n as any).text === "string";
}
export function isElement(n: SlateNode): n is ElementAny {
    return (n as any).type !== undefined;
}

// =================== Registry Resolve ===================
type ResolvedRule = SerializeRule & { __prio: number; __pack?: string };

function buildRegistry(packs: SerializeRulePack[] = []): ResolvedRule[] {
    const out: ResolvedRule[] = [];
    for (const p of packs) {
        const prio = p.priority ?? 0;
        for (const r of p.rules) {
            out.push(Object.assign({ __prio: prio, __pack: p.name }, r));
        }
    }
    // higher priority first; stable sort respected in modern engines
    out.sort((a, b) => (b.__prio - a.__prio));
    return out;
}

function resolveRule(node: SlateNode, registry: ResolvedRule[]): ResolvedRule | undefined {
    for (const r of registry) {
        try {
            if (r.match(node)) return r;
        } catch {
            // ignore match error, continue
        }
    }
    return undefined;
}

// =================== Text Leaf Serializer ===================
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

function serializeTextLeaf(leaf: TextLeaf, opts: Required<SerializeOptions>): string {
    // 1) escape text
    let text = escapeHtml(leaf.text ?? "");

    // 2) soft-break
    if (opts.softBreakAsBr && text.includes("\n")) {
        text = text.split("\n").map((t) => (t === "" ? "<br/>" : t)).join("\n");
    }

    // 3) semantic marks (deterministic order)
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

    // 4) inline styles to <span style="">
    const styleObj: Record<string, unknown> = {};
    for (const k of INLINE_STYLE_KEYS) {
        const val = (leaf as any)[k];
        if (val != null) styleObj[k] = val;
    }
    const style = styleString(styleObj);

    // 5) className (optional, sanitized)
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

// =================== Safe rule call ===================
function safeCallSerialize(rule: ResolvedRule, node: ElementAny, ctx: SerializerCtx): string {
    try {
        return rule.serialize(node as any, ctx);
    } catch (e) {
        // phòng thủ: nếu serialize lỗi, unwrap children thay vì crash
        return ctx.serializeChildren(node.children);
    }
}

// =================== Public API ===================
export function createSerializer({ plugins = [], options }: CreateSerializerArgs) {
    const opts: Required<SerializeOptions> = { ...defaultOptions, ...(options ?? {}) };
    const registry = buildRegistry(plugins);

    const ctx: SerializerCtx = {
        options: opts,
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
                // unreachable fallback
                out.push("");
            }
            return out.join("");
        },
    };

    function serialize(nodes: Descendant[] = []): string {
        return ctx.serializeChildren(nodes);
    }

    return {
        serialize,
        ctx,
        options: opts,
        // expose utils for rule files
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
