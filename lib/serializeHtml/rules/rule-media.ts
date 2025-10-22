/*
 * path: lib/serializeHtml/rules/rule-media.ts
 */
// lib/serializeHtml/rules/rule-media.ts
// Xử lý media: <img>, <video>, <audio>, <a download> (file), <iframe> (media_embed)
// - Caption: nếu có → <figure> … <figcaption> …
// - Align: mergeAlignStyle + gợi ý block-centering cho media (getMediaAlignCss)
// - URL: sanitizeUrl, cho phép data:image/* cho <img>

import type {
    SerializeRulePack,
    SlateNode,
    ElementAny,
    ImageElement,
    VideoElement,
    AudioElement,
    FileElement,
    MediaEmbedElement,
    Descendant,
} from "@/types";
import {
    escapeHtml,
    sanitizeUrl,
    safeClassName,
    styleString,
} from "../serializer-core";

import { mergeAlignStyle, getMediaAlignCss } from "./rule-align";

// ---------- type guards ----------
function isElement(n: SlateNode): n is ElementAny {
    return (n as any)?.type != null;
}
function isImg(n: SlateNode): n is ImageElement {
    return isElement(n) && n.type === "img";
}
function isVideo(n: SlateNode): n is VideoElement {
    return isElement(n) && n.type === "video";
}
function isAudio(n: SlateNode): n is AudioElement {
    return isElement(n) && n.type === "audio";
}
function isFile(n: SlateNode): n is FileElement {
    return isElement(n) && n.type === "file";
}
function isMediaEmbed(n: SlateNode): n is MediaEmbedElement {
    return isElement(n) && n.type === "media_embed";
}

// ---------- helpers ----------
function asNumberOrString(v: unknown): string | undefined {
    if (v == null) return undefined;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    const s = String(v).trim();
    return s || undefined;
}

function classAttr(node: ElementAny, allow = false): string {
    if (!allow || !node.className) return "";
    const safe = safeClassName(node.className);
    return safe ? ` class="${safe}"` : "";
}

function idAttr(node: ElementAny): string {
    return node.id ? ` id="${String(node.id).replace(/"/g, "&quot;")}"` : "";
}

function buildCommonStyle(node: ElementAny): string | undefined {
    const styleObj: Record<string, unknown> = {};
    // width (string/number) → để theme quyết định unit; nếu number coi là px
    if (node.width != null) styleObj.width = node.width;
    if (node.height != null) styleObj.height = node.height;
    if (node.lineHeight != null) styleObj.lineHeight = node.lineHeight;
    if (node.color != null) styleObj.color = node.color;
    if (node.backgroundColor != null) styleObj.backgroundColor = node.backgroundColor;

    // text-indent / indent ít khi áp cho media; nếu có vẫn giữ
    if ((node as any).textIndent != null) styleObj.textIndent = (node as any).textIndent;
    else if ((node as any).indent != null) styleObj.textIndent = (node as any).indent;

    const base = styleString(styleObj);
    // gộp text-align nếu có
    return mergeAlignStyle(base, node);
}

function buildMediaAttrs(node: ElementAny, allowClass: boolean) {
    const id = idAttr(node);
    const cls = classAttr(node, allowClass);
    const style = buildCommonStyle(node);
    const mediaAlign = getMediaAlignCss(node); // block-centering gợi ý
    const styleMerged = style || mediaAlign ? `${style ?? ""}${style && mediaAlign ? ";" : ""}${mediaAlign ?? ""}` : undefined;

    const attrs: Record<string, string | undefined> = {};
    if (id) attrs.id = id.slice(5, -1);           // remove id=".."
    if (cls) attrs.class = cls.slice(8, -1);      // remove class=".."
    if (styleMerged) attrs.style = styleMerged;

    return attrs;
}

function openTag(tag: string, attrs: Record<string, string | undefined>, selfClose = false): string {
    const parts: string[] = [tag];
    for (const [k, v] of Object.entries(attrs)) {
        if (!v) continue;
        parts.push(`${k}="${v.replace(/"/g, "&quot;")}"`);
    }
    return selfClose ? `<${parts.join(" ")} />` : `<${parts.join(" ")}>`;
}

function wrapFigureIfCaption(
    rawHtml: string,
    node: ElementAny,
    caption: string | Descendant[] | undefined,
    allowClass: boolean,
    serializeChildren: (nodes?: Descendant[]) => string
): string {
    if (caption == null || (Array.isArray(caption) && caption.length === 0) || (typeof caption === "string" && caption.trim() === "")) {
        return rawHtml;
    }
    // <figure> .. <figcaption> .. </figcaption> </figure>
    const attrs = buildMediaAttrs(node, allowClass); // cho figure thừa hưởng id/class/style nếu bạn muốn
    const figOpen = openTag("figure", attrs);
    const capInner = Array.isArray(caption) ? serializeChildren(caption) : escapeHtml(caption);
    return `${figOpen}${rawHtml}<figcaption>${capInner}</figcaption></figure>`;
}

// ---------- media_embed whitelist ----------
const IFRAME_WHITELIST = [
    /(^|\.)youtube\.com$/i,
    /(^|\.)youtu\.be$/i,
    /(^|\.)youtube-nocookie\.com$/i,
    /(^|\.)vimeo\.com$/i,
    /(^|\.)player\.vimeo\.com$/i,
    // Thêm nếu cần: soundcloud, spotify, …
];

function isWhitelistedIframe(src: string): boolean {
    try {
        // relative iframe không an toàn → từ chối
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(src)) return false;
        const u = new URL(src);
        const host = u.hostname.toLowerCase();
        return IFRAME_WHITELIST.some((re) => re.test(host));
    } catch {
        return false;
    }
}

// ---------- Rule Pack ----------
export const RuleMedia: SerializeRulePack = {
    name: "media",
    priority: 10, // cao (security-sensitive)
    rules: [
        // <img>
        {
            name: "img",
            match: isImg,
            serialize: (node, ctx) => {
                const url = (node.url ?? node.src ?? "").trim();
                const safe = ctx.options.sanitizeUrls ? sanitizeUrl(url, /* allowDataImage */ true) : url;
                if (!safe) return ""; // drop nếu URL không an toàn

                const attrs = buildMediaAttrs(node, ctx.options.allowClassName);
                attrs.src = safe;
                if (node.alt != null) attrs.alt = String(node.alt);
                // width/height attr chỉ khi là số (attr), còn style đã xử lý ở buildMediaAttrs
                const w = asNumberOrString(node.width);
                const h = asNumberOrString(node.height);
                if (w && /^\d+$/.test(w)) attrs.width = w;
                if (h && /^\d+$/.test(h)) attrs.height = h;

                // extra
                attrs.loading = "lazy";
                attrs.decoding = "async";
                if ((node as any).thumbnail) attrs["data-thumbnail"] = String((node as any).thumbnail);

                const img = openTag("img", attrs, true);

                // caption?
                return wrapFigureIfCaption(img, node, (node as any).caption, ctx.options.allowClassName, ctx.serializeChildren);
            },
        },

        // <video controls>
        {
            name: "video",
            match: isVideo,
            serialize: (node, ctx) => {
                const url = (node.url ?? node.src ?? "").trim();
                const safe = ctx.options.sanitizeUrls ? sanitizeUrl(url) : url;
                if (!safe) return "";

                const attrs = buildMediaAttrs(node, ctx.options.allowClassName);
                attrs.src = safe;
                attrs.controls = "controls";
                attrs.preload = "metadata";

                const w = asNumberOrString(node.width);
                const h = asNumberOrString(node.height);
                if (w && /^\d+$/.test(w)) attrs.width = w;
                if (h && /^\d+$/.test(h)) attrs.height = h;

                const videoOpen = openTag("video", attrs);
                const videoHtml = `${videoOpen}</video>`;

                return wrapFigureIfCaption(videoHtml, node, (node as any).caption, ctx.options.allowClassName, ctx.serializeChildren);
            },
        },

        // <audio controls>
        {
            name: "audio",
            match: isAudio,
            serialize: (node, ctx) => {
                const url = (node.url ?? node.src ?? "").trim();
                const safe = ctx.options.sanitizeUrls ? sanitizeUrl(url) : url;
                if (!safe) return "";

                const attrs = buildMediaAttrs(node, ctx.options.allowClassName);
                attrs.src = safe;
                attrs.controls = "controls";
                attrs.preload = "metadata";

                const audioOpen = openTag("audio", attrs);
                const audioHtml = `${audioOpen}</audio>`;

                return wrapFigureIfCaption(audioHtml, node, (node as any).caption, ctx.options.allowClassName, ctx.serializeChildren);
            },
        },

        // file → <a download>
        {
            name: "file",
            match: isFile,
            serialize: (node, ctx) => {
                const url = (node.url ?? node.src ?? "").trim();
                const safe = ctx.options.sanitizeUrls ? sanitizeUrl(url) : url;
                if (!safe) return "";

                const attrs = buildMediaAttrs(node, ctx.options.allowClassName);
                // Đối với <a>, id/class/style đã trong attrs
                const name = (node as any).name ? String((node as any).name) : (new URL(safe, "http://x/").pathname.split("/").pop() || "download");
                attrs.href = safe;
                attrs.download = name;

                const a = openTag("a", attrs);
                const text = escapeHtml(name);
                const aHtml = `${a}${text}</a>`;

                return wrapFigureIfCaption(aHtml, node, (node as any).caption, ctx.options.allowClassName, ctx.serializeChildren);
            },
        },

        // media_embed → <iframe> (whitelist host)
        {
            name: "media_embed",
            match: isMediaEmbed,
            serialize: (node, ctx) => {
                const url = (node.url ?? node.src ?? "").trim();
                // bắt buộc https? và whitelist host
                const safe = ctx.options.sanitizeUrls ? sanitizeUrl(url) : url;
                if (!safe || !isWhitelistedIframe(safe)) return "";

                const attrs = buildMediaAttrs(node, ctx.options.allowClassName);
                attrs.src = safe;
                attrs.loading = "lazy";
                attrs.referrerpolicy = "no-referrer-when-downgrade";
                attrs.allowfullscreen = "true";
                if ((node as any).title) attrs.title = String((node as any).title);
                if ((node as any).allow) attrs.allow = String((node as any).allow);

                // Đặt size mặc định nếu không có
                if (!attrs.width) attrs.width = "560";
                if (!attrs.height) attrs.height = "315";

                const iframeOpen = openTag("iframe", attrs);
                const iframeHtml = `${iframeOpen}</iframe>`;

                // Caption nếu có
                return wrapFigureIfCaption(iframeHtml, node, (node as any).caption, ctx.options.allowClassName, ctx.serializeChildren);
            },
        },
    ],
};
