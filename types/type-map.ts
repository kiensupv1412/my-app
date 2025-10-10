// types.ts — unified type map & serializer contracts

// ===== Raw constants =====
export const NODES = {
    a: "a",
    ai: "ai",
    aiChat: "aiChat",
    audio: "audio",
    blockquote: "blockquote",
    bold: "bold",
    callout: "callout",
    code: "code",
    codeBlock: "code_block",
    codeLine: "code_line",
    codeSyntax: "code_syntax",
    column: "column",
    columnGroup: "column_group",
    comment: "comment",
    date: "date",
    emojiInput: "emoji_input",
    equation: "equation",
    excalidraw: "excalidraw",
    file: "file",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    highlight: "highlight",
    hr: "hr",
    img: "img",
    inlineEquation: "inline_equation",
    italic: "italic",
    kbd: "kbd",
    li: "li",
    lic: "lic",
    link: "a",
    listTodoClassic: "action_item",
    mediaEmbed: "media_embed",
    mention: "mention",
    mentionInput: "mention_input",
    olClassic: "ol",
    p: "p",
    searchHighlight: "search_highlight",
    slashInput: "slash_input",
    strikethrough: "strikethrough",
    sub: "subscript",
    suggestion: "suggestion",
    sup: "superscript",
    table: "table",
    tag: "tag",
    taskList: "taskList",
    td: "td",
    th: "th",
    toc: "toc",
    toggle: "toggle",
    tr: "tr",
    ulClassic: "ul",
    underline: "underline",
    video: "video",
} as const;

export const STYLE_KEYS = {
    backgroundColor: "backgroundColor",
    color: "color",
    fontFamily: "fontFamily",
    fontSize: "fontSize",
    fontWeight: "fontWeight",
    indent: "indent",
    lineHeight: "lineHeight",
    listType: "listStyleType",
    textAlign: "textAlign",
    textIndent: "textIndent",
} as const;

export const KEYS = {
    ...STYLE_KEYS,
    ...NODES,
    heading: ["h1", "h2", "h3", "h4", "h5", "h6"] as const,
} as const;

// ===== Derived unions =====
export type NodeType = typeof NODES[keyof typeof NODES];
export type StyleKey = typeof STYLE_KEYS[keyof typeof STYLE_KEYS];
export type HeadingNode = typeof KEYS.heading[number];

// ===== Text (leaf) with marks =====
export type TextLeaf = {
    text: string;

    /** Semantic marks */
    bold?: boolean;              // <strong>
    italic?: boolean;            // <em>
    underline?: boolean;         // <u>
    strikethrough?: boolean;     // <s> | <del>
    code?: boolean;              // <code>
    highlight?: boolean;         // <mark>
    sub?: boolean;               // <sub>
    sup?: boolean;               // <sup>
    kbd?: boolean;               // <kbd>

    /** Aliases */
    subscript?: boolean;         // alias for sub
    superscript?: boolean;       // alias for sup

    /** Style marks (inline CSS) */
    color?: string;
    backgroundColor?: string;
    fontWeight?: string | number;
    fontStyle?: string;          // "normal" | "italic" | "oblique"
    textDecoration?: string;     // "underline" | "line-through" | ...
    fontFamily?: string;
    fontSize?: string | number;
    letterSpacing?: string | number;
    wordSpacing?: string | number;

    /** Annotation-like flags */
    suggestion?: boolean;
    comment?: boolean;

    /** Meta */
    data?: Record<string, any>;
    className?: string;

    /** Future-safe */
    [k: string]: any;
};

// ===== Base Element =====
export type AlignValue = "left" | "center" | "right" | "justify";

export interface BaseElement<T extends NodeType = NodeType> {
    type: T;
    id?: string;
    children: Array<TextLeaf | ElementAny>;

    /** Common block styles */
    textAlign?: AlignValue;
    align?: AlignValue;
    textIndent?: number;
    indent?: number;
    listStyleType?: string;
    listStart?: number;
    checked?: boolean;
    lineHeight?: string | number;
    fontSize?: string | number;
    fontFamily?: string;
    fontWeight?: string | number;
    color?: string;
    backgroundColor?: string;

    /** Common media/layout props */
    width?: number | string;
    url?: string;
    src?: string;

    /** Table/columns extras */
    colSizes?: Array<number>;
    marginLeft?: number;
    layout?: Array<number | string>;

    /** Attrs */
    className?: string;
    dir?: "ltr" | "rtl" | "auto";

    /** Extensible */
    [k: string]: any;
}

// ===== Specific elements =====
export interface ParagraphElement extends BaseElement<"p"> { }
export interface HeadingElement extends BaseElement<HeadingNode> { }
export interface BlockquoteElement extends BaseElement<"blockquote"> { }

export interface LinkElement extends BaseElement<"a"> {
    url: string;
    title?: string;
    rel?: string;
    target?: "_self" | "_blank" | "_parent" | "_top";
}

export interface ImageElement extends BaseElement<"img"> {
    url: string;
    alt?: string;
    thumbnail?: string;
    caption?: Descendant[] | string;
    height?: number | string;
}

export interface FileElement extends BaseElement<"file"> {
    url: string;
    name?: string;
    isUpload?: boolean;
}

export interface AudioElement extends BaseElement<"audio"> {
    url: string;
    isUpload?: boolean;
}

export interface VideoElement extends BaseElement<"video"> {
    url: string;
    isUpload?: boolean;
}

export interface MediaEmbedElement extends BaseElement<"media_embed"> {
    url: string;
    title?: string;
    allow?: string;
}

export interface DateInlineElement extends BaseElement<"date"> {
    date: string; // ISO-like string
}

export interface MentionInlineElement extends BaseElement<"mention"> {
    key?: string;
    value: string;
}

export interface InlineEquationElement extends BaseElement<"inline_equation"> {
    texExpression: string;
}

export interface EquationElement extends BaseElement<"equation"> {
    texExpression: string;
}

export interface TocElement extends BaseElement<"toc"> { }

export interface ColumnGroupElement extends BaseElement<"column_group"> {
    layout: Array<number | string>;
    children: ColumnElement[];
}
export interface ColumnElement extends BaseElement<"column"> {
    width?: number | string;
}

export interface UlElement extends BaseElement<"ul"> { }
export interface OlElement extends BaseElement<"ol"> { }
export interface LiElement extends BaseElement<"li"> { }

export interface HrElement extends BaseElement<"hr"> {
    children: [];
}

export interface CodeBlockElement extends BaseElement<"code_block"> {
    language?: string;
}
export interface CodeLineElement extends BaseElement<"code_line"> { }

export interface TableElement extends BaseElement<"table"> {
    colSizes?: number[];
    marginLeft?: number;
}
export interface TrElement extends BaseElement<"tr"> { }

export interface ThElement extends BaseElement<"th"> {
    // colspan/rowspan
    colSpan?: number;
    rowSpan?: number;

    // Border mỗi cạnh: số pixel (0 = none)
    borderTop?: number;
    borderRight?: number;
    borderBottom?: number;
    borderLeft?: number;

    // Tuỳ chọn style/color chung cho border (fallback nếu không đặt theo cạnh)
    borderStyle?: string;  // e.g. "solid" | "dashed"
    borderColor?: string;  // e.g. "#ddd"
}

export interface TdElement extends BaseElement<"td"> {
    colSpan?: number;
    rowSpan?: number;

    borderTop?: number;
    borderRight?: number;
    borderBottom?: number;
    borderLeft?: number;

    borderStyle?: string;
    borderColor?: string;
}


// ===== Union =====
export type ElementAny =
    | ParagraphElement
    | HeadingElement
    | BlockquoteElement
    | LinkElement
    | ImageElement
    | FileElement
    | AudioElement
    | VideoElement
    | MediaEmbedElement
    | DateInlineElement
    | MentionInlineElement
    | InlineEquationElement
    | EquationElement
    | TocElement
    | ColumnGroupElement
    | ColumnElement
    | UlElement
    | OlElement
    | LiElement
    | HrElement
    | CodeBlockElement
    | CodeLineElement
    | TableElement
    | TrElement
    | ThElement
    | TdElement
    | BaseElement; // fallback

export type SlateNode = TextLeaf | ElementAny;
export type Descendant = SlateNode;

// ===== Serialize engine types =====
export type SerializeOptions = {
    softBreakAsBr?: boolean;      // "\n" -> <br/>
    sanitizeUrls?: boolean;       // safe href/src (rules decide allowDataImage, host whitelist)
    allowClassName?: boolean;     // allow className passthrough
    onUnknown?: (node: SlateNode) => "drop" | "unwrap";
};

export type SerializerCtx = {
    serializeChildren: (nodes?: Descendant[]) => string;
    options: Required<SerializeOptions>;
};

export type SerializeRule<N extends SlateNode = SlateNode> = {
    name: string;
    match: (node: SlateNode) => node is N;
    serialize: (node: N, ctx: SerializerCtx) => string;
};

// Grouped rule pack (each file rule-* will export một pack như thế này)
export type SerializeRulePack = {
    name: string;              // tên logic, không dùng "plugin/kit"
    priority?: number;         // cao hơn -> xét trước
    rules: SerializeRule[];
};
