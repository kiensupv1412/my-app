'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';

type RestoreMode = 'auto' | 'caret' | 'selection';

/* ============================ */
/*           COMPONENTS         */
/* ============================ */

type ToolbarProps = {
    onBold: () => void;
    onItalic: () => void;
    onUnderline: () => void;
    onOpenLink: () => void;
    canOpenLink: boolean;
    onMouseDownPreserve: (e: React.MouseEvent) => void;
};
const Toolbar = React.memo(function Toolbar({
    onBold, onItalic, onUnderline, onOpenLink, canOpenLink, onMouseDownPreserve,
}: ToolbarProps) {
    return (
        <div className="flex items-center gap-2 rounded-sm border bg-white px-2 py-1 shadow-sm" data-inline-toolbar>
            <button
                type="button"
                className="rounded border px-2 py-1 text-sm font-semibold hover:bg-muted"
                onMouseDown={onMouseDownPreserve}
                onClick={onBold}
                title="Bold"
            >B</button>

            <button
                type="button"
                className="rounded border px-2 py-1 text-sm italic hover:bg-muted"
                onMouseDown={onMouseDownPreserve}
                onClick={onItalic}
                title="Italic"
            >I</button>

            <button
                type="button"
                className="rounded border px-2 py-1 text-sm underline hover:bg-muted"
                onMouseDown={onMouseDownPreserve}
                onClick={onUnderline}
                title="Underline"
            >U</button>

            <button
                type="button"
                className="rounded border px-2 py-1 text-sm hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
                onMouseDown={onMouseDownPreserve}
                onClick={onOpenLink}
                title="Insert link"
                disabled={!canOpenLink}
            >🔗 Link</button>

            <div className="ml-auto text-xs text-muted-foreground">
                Bôi đen để hiện menu bong bóng • Toolbar luôn giữ caret hiện tại
            </div>
        </div>
    );
});

type TextEditorProps = {
    editorRef: React.RefObject<HTMLDivElement | null>;
    onMouseDownCapture: () => void;
    onKeyDownCapture: () => void;
    onInputCapture: () => void;
    onMouseUp: () => void;
    onKeyUp: () => void;
    description?: string | null;
};
const TextEditor = React.memo(function TextEditor({
    editorRef, onMouseDownCapture, onKeyDownCapture, onInputCapture, onMouseUp, onKeyUp, description,
}: TextEditorProps) {
    return (
        <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onMouseDownCapture={onMouseDownCapture}
            onKeyDownCapture={onKeyDownCapture}
            onInputCapture={onInputCapture}
            onMouseUp={onMouseUp}
            onKeyUp={onKeyUp}
            className="min-h-[200px] rounded border p-4 leading-7 outline-none focus:ring-2 focus:ring-ring/30"
        >
            {description ?? (
                <>Nhập văn bản ở đây, bôi đen để hiện menu. Bạn có thể <b>in đậm</b>, <i>nghiêng</i> hoặc <u>gạch chân</u>, và tạo liên kết.</>
            )}
        </div>
    );
});

type LinkFormProps = {
    url: string;
    linkText: string;
    setUrl: (v: string) => void;
    setLinkText: (v: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
};
const LinkForm = React.memo(function LinkForm({
    url, linkText, setUrl, setLinkText, onSubmit, onCancel,
}: LinkFormProps) {
    return (
        <div className="w-[360px] p-2">
            <div className="rounded-2xl border bg-white shadow-sm">
                <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-gray-500">🔗</span>
                    <input
                        autoFocus
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); onSubmit(); }
                            else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
                        }}
                        placeholder="https://example.com"
                        className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
                    />
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-gray-500">≡</span>
                    <input
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        placeholder="Văn bản hiển thị của liên kết"
                        className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div className="mt-2 flex justify-end gap-2">
                <button className="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100" onClick={onCancel}>✕</button>
                <button className="rounded-md bg-black px-3 py-1 text-sm text-white hover:bg-black/90" onClick={onSubmit}>
                    Insert into post
                </button>
            </div>
        </div>
    );
});

type BubbleMenuPortalProps = {
    container: HTMLElement | null;              // đã fix SSR
    show: boolean;
    pos: { x: number; y: number };
    menuRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
    onMouseDownGuard?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onRequestClose?: () => void;                // <-- thêm
};

const BubbleMenuPortal = React.memo(function BubbleMenuPortal({
    container, show, pos, menuRef, children, onMouseDownGuard, onRequestClose,
}: BubbleMenuPortalProps) {
    // Không render khi chưa có container (SSR) hoặc đang ẩn
    if (!show || !container) return null;

    // Outside-click + ESC để đóng
    React.useEffect(() => {
        if (!show) return;

        const onDocMouseDown = (e: MouseEvent) => {
            const target = e.target as Node | null;
            const inMenu = !!menuRef.current && !!target && menuRef.current.contains(target);
            if (!inMenu) onRequestClose?.();
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onRequestClose?.();
        };

        // capture để ưu tiên trước các handler khác
        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [show, menuRef, onRequestClose]);

    return createPortal(
        <div
            ref={menuRef}
            onMouseDown={(e) => { if (onMouseDownGuard) onMouseDownGuard(e); }}
            contentEditable={false}
            className="pointer-events-auto absolute z-50 -translate-x-1/2 -translate-y-full rounded-xl border bg-white shadow-lg ring-1 ring-black/5"
            style={{ left: pos.x, top: pos.y }}
        >
            {children}
        </div>,
        container,
    );
});


/* ============================ */
/*         MAIN EDITOR          */
/* ============================ */
type InlineEditorProps = {
    description: string;
};
export default function InlineEditor({ description }: InlineEditorProps) {
    // ----- Refs -----
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const savedRangeRef = React.useRef<Range | null>(null);
    const lastCaretRangeRef = React.useRef<Range | null>(null);
    const linkAnchorRef = React.useRef<HTMLAnchorElement | null>(null);
    const linkRangeRef = React.useRef<Range | null>(null);

    // ----- State -----
    const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });
    const [showMenu, setShowMenu] = React.useState(false);
    const [showLinkForm, setShowLinkForm] = React.useState(false);
    const [url, setUrl] = React.useState('');
    const [linkText, setLinkText] = React.useState('');
    const [canOpenLink, setCanOpenLink] = React.useState(false);

    // ----- Helpers -----
    const isBlankSelectionText = (s: string) => !s || !s.replace(/\u00A0/g, ' ').trim().length;
    const focusEditor = () => editorRef.current?.focus();

    const closestAnchorFromSelection = React.useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const r = sel.getRangeAt(0);
        const node =
            r.startContainer.nodeType === 1
                ? (r.startContainer as Element)
                : r.startContainer.parentElement;
        return (node?.closest('a') as HTMLAnchorElement) || null;
    }, []);

    const getSelectionRange = () => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        return sel.getRangeAt(0).cloneRange();
    };

    const hasNonBlankSelection = React.useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
        return !isBlankSelectionText(sel.toString());
    }, []);

    // ----- Selection / Caret -----
    const saveSelectionOrCaret = React.useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const r = sel.getRangeAt(0).cloneRange();

        if (sel.isCollapsed) {
            lastCaretRangeRef.current = r;
            savedRangeRef.current = null;
            return;
        }

        const txt = sel.toString();
        savedRangeRef.current = isBlankSelectionText(txt) ? null : r;

        const caret = r.cloneRange();
        caret.collapse(false);
        lastCaretRangeRef.current = caret;
    }, []);

    const restoreRange = React.useCallback((mode: RestoreMode = 'auto') => {
        const sel = window.getSelection();
        if (!sel) return;

        let r: Range | null = null;
        if (mode === 'caret') r = lastCaretRangeRef.current;
        else if (mode === 'selection') r = savedRangeRef.current;
        else {
            const hasNonBlankSel =
                sel.rangeCount > 0 && !sel.isCollapsed && !isBlankSelectionText(sel.toString());
            r = hasNonBlankSel ? (savedRangeRef.current ?? sel.getRangeAt(0))
                : (lastCaretRangeRef.current ?? savedRangeRef.current);
        }
        if (!r) return;
        sel.removeAllRanges();
        sel.addRange(r);
    }, []);

    const restoreRangePreferCaret = React.useCallback(() => {
        const sel = window.getSelection();
        if (!sel) return;
        const r = savedRangeRef.current ?? lastCaretRangeRef.current;
        if (!r) return;
        sel.removeAllRanges();
        sel.addRange(r);
    }, []);

    // ----- Word range at caret -----
    const getWordRangeAtCaret = (root: HTMLElement) => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;

        const r0 = sel.getRangeAt(0);
        let container = r0.startContainer;

        if (container.nodeType !== Node.TEXT_NODE) {
            const el = container as Element;
            const probe =
                el.childNodes[r0.startOffset] ||
                el.childNodes[r0.startOffset - 1] ||
                el.firstChild;

            if (probe && probe.nodeType === Node.TEXT_NODE) {
                container = probe;
            } else {
                return r0.cloneRange();
            }
        }

        const textNode = container as Text;
        const text = textNode.data || '';
        let start = r0.startOffset;
        let end = r0.startOffset;

        while (start > 0 && /\S/.test(text[start - 1])) start--;
        while (end < text.length && /\S/.test(text[end])) end++;

        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);
        return range;
    };

    // ----- Caret placement -----
    const placeCaretInside = (el: Node, atEnd = true) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(atEnd);
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        sel.addRange(range);
    };

    const placeCaretAfter = (node: Node) => {
        const range = document.createRange();
        range.setStartAfter(node);
        range.collapse(true);
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        sel.addRange(range);
        saveSelectionOrCaret();
    };

    // ----- Bubble logic -----
    const handleSelectionChangeForBubble = React.useCallback(() => {
        if (showLinkForm) return;

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed || isBlankSelectionText(sel.toString())) {
            setShowMenu(false);
            setShowLinkForm(false);
            return;
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        setMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
        setShowMenu(true);
        setShowLinkForm(false);
    }, [showLinkForm]);

    // ----- Toolbar actions -----
    const exec = React.useCallback((command: string, value?: string) => {
        const sel = window.getSelection();
        const noNonBlankSelection = !sel || sel.isCollapsed || isBlankSelectionText(sel.toString());

        restoreRange(noNonBlankSelection ? 'caret' : 'selection');
        focusEditor();
        document.execCommand(command, false, value);
        saveSelectionOrCaret();
    }, [restoreRange, saveSelectionOrCaret]);

    const applyBold = () => exec('bold');
    const applyItalic = () => exec('italic');
    const applyUnderline = () => exec('underline');

    // ----- Link logic -----
    const normalizeUrl = (input: string) => {
        const s = input.trim();
        if (!s) return '';
        if (/^https?:\/\//i.test(s)) return s;
        return `https://${s}`;
    };

    const openLinkForm = () => {
        restoreRangePreferCaret();

        const a = closestAnchorFromSelection();
        if (a) {
            linkAnchorRef.current = a;
            setUrl(a.getAttribute('href') || '');
            setLinkText(a.textContent || '');

            const rect = a.getBoundingClientRect();
            setMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });

            setShowLinkForm(true);
            setShowMenu(true);
            return;
        }

        if (!hasNonBlankSelection()) return;

        const sel = window.getSelection()!;
        const r = sel.getRangeAt(0).cloneRange();

        linkAnchorRef.current = null;
        linkRangeRef.current = r.cloneRange();
        savedRangeRef.current = r.cloneRange();

        const caret = r.cloneRange(); caret.collapse(false);
        lastCaretRangeRef.current = caret;

        setUrl('');
        setLinkText(r.toString().trim());

        const rect = r.getBoundingClientRect();
        setMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });

        setShowLinkForm(true);
        setShowMenu(true);
    };

    const applyLink = () => {
        const href = normalizeUrl(url);

        // sửa link cũ
        if (linkAnchorRef.current) {
            const a = linkAnchorRef.current;

            if (!href) {
                const text = linkText?.length ? linkText : (a.textContent || '');
                const textNode = document.createTextNode(text);
                a.replaceWith(textNode);
                placeCaretAfter(textNode);
            } else {
                a.setAttribute('href', href);
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
                a.classList.add('underline', 'underline-offset-4', 'decoration-primary', 'font-medium');
                if (typeof linkText === 'string' && linkText !== a.textContent) a.textContent = linkText;
                placeCaretAfter(a);
            }

            linkAnchorRef.current = null;
            linkRangeRef.current = null;
            setUrl(''); setLinkText('');
            setShowLinkForm(false); setShowMenu(false);
            return;
        }
        // === Tạo link mới ===
        let base = linkRangeRef.current ? linkRangeRef.current.cloneRange() : null;
        if (!base || base.collapsed) {
            base = (editorRef.current && getWordRangeAtCaret(editorRef.current)) || getSelectionRange();
        }
        if (!base) { setShowLinkForm(false); setShowMenu(false); return; }

        // NEW: nắn range để không cắt “nửa” <a>
        base = normalizeRangeToAvoidPartialAnchors(base);

        focusEditor();
        restoreRangePreferCaret();

        const textRaw = linkText && linkText.length ? linkText : base.toString();
        const textForInsert = isBlankSelectionText(textRaw) ? (href || '') : textRaw;

        if (isBlankSelectionText(textForInsert) && !href) {
            setShowLinkForm(false); setShowMenu(false);
            return;
        }

        // Xoá nội dung cũ trong base (sau khi đã nắn biên)
        base.deleteContents();

        if (!href) {
            const tn = document.createTextNode(textForInsert);
            base.insertNode(tn);
            placeCaretAfter(tn);
        } else {
            const a = document.createElement('a');
            a.href = href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'underline underline-offset-4 decoration-primary font-medium';
            a.textContent = textForInsert;
            base.insertNode(a);
            placeCaretAfter(a);
        }

        // NEW: dọn rác anchor (xoá a rỗng, gộp a liền kề)
        if (editorRef.current) cleanupAnchors(editorRef.current);

        // reset
        linkAnchorRef.current = null;
        linkRangeRef.current = null;
        setUrl(''); setLinkText('');
        setShowLinkForm(false); setShowMenu(false);
    }

    const closeBubble = React.useCallback(() => {
        setShowLinkForm(false);
        setShowMenu(false);
    }, []);

    // ----- Derived: canOpenLink -----
    React.useEffect(() => {
        const update = () => {
            const a = closestAnchorFromSelection();
            setCanOpenLink(!!a || hasNonBlankSelection());
        };
        document.addEventListener('selectionchange', update);
        return () => document.removeEventListener('selectionchange', update);
    }, [closestAnchorFromSelection, hasNonBlankSelection]);

    // ----- Editor events -----
    const onMouseUpOrKeyUp = () => {
        saveSelectionOrCaret();
        handleSelectionChangeForBubble();
    };

    React.useEffect(() => {
        const onSC = () => saveSelectionOrCaret();
        document.addEventListener('selectionchange', onSC);
        return () => document.removeEventListener('selectionchange', onSC);
    }, [saveSelectionOrCaret]);

    // intercept click link để sửa thay vì điều hướng
    React.useEffect(() => {
        const root = editorRef.current;
        if (!root) return;

        const onClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const a = target?.closest('a');
            if (a && root.contains(a)) {
                e.preventDefault();
                (root as HTMLElement).focus();
                placeCaretInside(a.firstChild || a, true);

                linkAnchorRef.current = a as HTMLAnchorElement;
                setUrl(a.getAttribute('href') || '');
                setLinkText(a.textContent || '');
                setShowLinkForm(true);
                setShowMenu(true);

                const rect = a.getBoundingClientRect();
                setMenuPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
            }
        };

        root.addEventListener('click', onClick);
        return () => root.removeEventListener('click', onClick);
    }, []);

    // guard cho bubble để không “nuốt” focus input
    const onBubbleMouseDownGuard = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.target as HTMLElement;
        // cho phép tương tác trong form; chặn drag-select gây mất focus
        if (!el.closest('input, textarea, select, button')) e.preventDefault();
    };

    // preserve caret khi bấm nút toolbar
    const onMouseDownPreserve = (e: React.MouseEvent) => {
        saveSelectionOrCaret();
        e.preventDefault();
        e.stopPropagation();
    };
    const [container, setContainer] = React.useState<HTMLElement | null>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setContainer(document.body);
        setMounted(true);
    }, []);
    return (
        <div className="relative w-full p-6">
            <Toolbar
                onBold={applyBold}
                onItalic={applyItalic}
                onUnderline={applyUnderline}
                onOpenLink={openLinkForm}
                canOpenLink={canOpenLink}
                onMouseDownPreserve={onMouseDownPreserve}
            />

            <TextEditor
                editorRef={editorRef}
                onMouseDownCapture={saveSelectionOrCaret}
                onKeyDownCapture={saveSelectionOrCaret}
                onInputCapture={saveSelectionOrCaret}
                onMouseUp={onMouseUpOrKeyUp}
                onKeyUp={onMouseUpOrKeyUp}
                description={description}
            />
            {mounted && container && showMenu && (
                <BubbleMenuPortal
                    container={container!}
                    show={showMenu}
                    pos={menuPos}
                    menuRef={menuRef}
                    onMouseDownGuard={onBubbleMouseDownGuard}
                    onRequestClose={closeBubble}   // <-- chỉ cần thêm dòng này
                >
                    {!showLinkForm ? (
                        <div className="flex items-center gap-1 p-1">
                            <button className="rounded-md px-2 py-1 text-sm hover:bg-gray-100" onClick={applyBold} title="Bold">
                                <span className="font-bold">B</span>
                            </button>
                            <button className="rounded-md px-2 py-1 text-sm hover:bg-gray-100" onClick={applyItalic} title="Italic">
                                <span className="italic">I</span>
                            </button>
                            <button className="rounded-md px-2 py-1 text-sm hover:bg-gray-100" onClick={applyUnderline} title="Underline">
                                <span className="underline">U</span>
                            </button>
                            <button className="rounded-md px-2 py-1 text-sm hover:bg-gray-100" onClick={openLinkForm} title="Insert link">
                                🔗
                            </button>
                        </div>
                    ) : (
                        <LinkForm
                            url={url}
                            linkText={linkText}
                            setUrl={setUrl}
                            setLinkText={setLinkText}
                            onSubmit={applyLink}
                            onCancel={closeBubble}      // <-- cancel cũng dùng close chung
                        />
                    )}
                </BubbleMenuPortal>)}
        </div>
    );
}

function isWhitespaceOnly(node: Node | null) {
    if (!node) return true;
    const t = node.textContent ?? '';
    return !t.replace(/\u00A0/g, ' ').trim().length;
}

function closestA(node: Node | null): HTMLAnchorElement | null {
    if (!node) return null;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    return (el?.closest('a') as HTMLAnchorElement) || null;
}

/** Tránh chọn “nửa thẻ a”: kéo biên range để bao trọn các <a> đang bị chạm */
function normalizeRangeToAvoidPartialAnchors(range: Range): Range {
    const r = range.cloneRange();

    const startA = closestA(r.startContainer);
    if (startA) r.setStartBefore(startA);

    const endA = closestA(r.endContainer);
    if (endA) r.setEndAfter(endA);

    // nếu điểm đầu/điểm cuối là text node rỗng do split, nắn lại thêm lần nữa
    const startA2 = closestA(r.startContainer);
    if (startA2 && isWhitespaceOnly(startA2)) r.setStartBefore(startA2);
    const endA2 = closestA(r.endContainer);
    if (endA2 && isWhitespaceOnly(endA2)) r.setEndAfter(endA2);

    return r;
}

/** Cleanup sau khi thao tác: xoá <a> rỗng, gộp <a> kề nhau có cùng href/attrs */
function cleanupAnchors(root: HTMLElement) {
    // 1) remove anchors with empty text
    root.querySelectorAll('a').forEach((a) => {
        if (isWhitespaceOnly(a)) a.replaceWith(document.createTextNode(''));
    });

    // 2) merge adjacent anchors: <a>foo</a><a>bar</a> → <a>foobar</a> (nếu cùng attrs)
    const anchors = Array.from(root.querySelectorAll('a'));
    for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i], b = anchors[i + 1];
        if (!a.isConnected || !b.isConnected) continue;
        // chỉ gộp khi kề nhau và cùng href/target/rel/className
        const adjacent = a.nextSibling === b;
        const same =
            a.getAttribute('href') === b.getAttribute('href') &&
            a.getAttribute('target') === b.getAttribute('target') &&
            a.getAttribute('rel') === b.getAttribute('rel') &&
            a.className === b.className;

        if (adjacent && same) {
            a.textContent = (a.textContent || '') + (b.textContent || '');
            b.remove();
            // lùi i để kiểm tra tiếp tục gộp nếu có thêm a kề
            i = Math.max(-1, i - 2);
        }
    }
}
