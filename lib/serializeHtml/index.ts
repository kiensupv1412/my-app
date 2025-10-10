// lib/serializeHtml/index.ts — ENTRY ONLY

import type { Descendant, SerializeOptions } from "@/types";

// Core
import { createSerializer } from "./serializer-core";

// Rules
import { RuleColumn } from "./rules/rule-column";
import { RuleTable } from "./rules/rule-table";
import { RuleLink } from "./rules/rule-link";
import { RuleMedia } from "./rules/rule-media";
import { packListRuns, RuleListGroup, RuleList } from "./rules/rule-list";
import { RuleBasicBlocks } from "./rules/rule-basic-blocks";
import { RuleAlign } from "./rules/rule-align";
import { RuleFallback } from "./rules/rule-fallback";
import { RuleDate } from "./rules/rule-date";
import { RuleComment, dropCommentsPrepass } from "./rules/rule-comment";

// Thứ tự ưu tiên: structure/security → blocks/layout → lists(grouped) → inline → styles → fallback
const DEFAULT_RULES = [
    // Structure / layout trước để chặn “nuốt” node (vd: column)
    RuleComment,
    RuleColumn,
    RuleMedia,

    RuleDate,

    // Blocks cơ bản
    RuleBasicBlocks,

    // Lists: group trước, fallback sau
    RuleListGroup,
    RuleList,

    // Inline đặc biệt
    RuleLink,
    RuleTable,

    // Styles
    RuleAlign,

    // Cuối cùng
    RuleFallback,
] as const;

/** API chính */
export function serializeHtml(
    nodes: Descendant[] = [],
    options?: SerializeOptions
): string {
    const noComment = dropCommentsPrepass(nodes);
    const packed = packListRuns(noComment);
    const { serialize } = createSerializer({
        plugins: DEFAULT_RULES as unknown as any,
        options,
    });

    return serialize(packed);
}


