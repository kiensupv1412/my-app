/*
 * path: components/editor/plate-editor.tsx
 */
'use client';

import { Plate } from '@udecode/plate/react';
import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Editor as SlateEditor, Transforms } from 'slate';

import { SettingsDialog } from '@/components/editor/settings';
import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';

// bảo hiểm: chuẩn hoá content sang Slate Value
function normalizeValue(raw: any): any[] {
  const EMPTY = [{ type: 'p', children: [{ text: '' }] }];
  if (Array.isArray(raw)) return raw;
  if (!raw && raw !== 0) return EMPTY;

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return EMPTY;
    // thử parse JSON
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
      // nếu không phải array → coi như text
      return [{ type: 'p', children: [{ text: s }] }];
    } catch {
      return [{ type: 'p', children: [{ text: s }] }];
    }
  }

  // nếu lỡ là object {nodes: [...]}
  if (typeof raw === 'object' && Array.isArray(raw?.nodes)) {
    return raw.nodes;
  }

  return EMPTY;
}

export function PlateEditor({
  content,
  onChange,
}: {
  content?: any;
  onChange?: (v: any) => void;
}) {
  console.log("🚀 ~ PlateEditor ~ content:", content)
  const editor = useCreateEditor();

  // chỉ tạo value khi content thay đổi
  const value = React.useMemo(() => normalizeValue(content), [content]);

  // set value vào editor sau khi editor có mặt
  React.useEffect(() => {
    if (!editor) return;
    SlateEditor.withoutNormalizing(editor, () => {
      editor.children = value;
      Transforms.deselect(editor);
      editor.onChange();
    });
  }, [editor, value]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate
        editor={editor}
        onValueChange={(v) => {
          onChange?.(v);
        }}
      >
        <EditorContainer>
          <Editor variant="demo" />
        </EditorContainer>
        <SettingsDialog />
      </Plate>
    </DndProvider>
  );
}
// const [cleanHtml, setCleanHtml] = React.useState('')
// const dumpCleanHtml = React.useCallback(() => {
//   try {
//     // 1) lấy DOM node của editor
//     const root = ReactEditor.toDOMNode(editor as any, editor as any) as HTMLElement
//     const clone = root.cloneNode(true) as HTMLElement

//     // 2) biến div.slate-p thành <p> chuẩn
//     clone.querySelectorAll('div.slate-p').forEach((div) => {
//       const p = document.createElement('p')
//       p.innerHTML = (div as HTMLElement).innerHTML
//         ; (div as HTMLElement).replaceWith(p)
//     })

//     // 3) lọc trắng: chỉ giữ thẻ/attr văn bản
//     const html = sanitizeHtml(clone.innerHTML, {
//       allowedTags: [
//         'p', 'a', 'strong', 'em', 'u', 's', 'code', 'pre',
//         'ul', 'ol', 'li', 'blockquote', 'br',
//         'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
//       ],
//       allowedAttributes: {
//         a: ['href', 'rel', 'target'],
//         // nếu muốn cho phép class cho styling, thêm ở đây, còn không thì bỏ sạch class
//       },
//       // ép thêm rel/target an toàn cho link
//       transformTags: {
//         'a': (tagName, attribs) => ({
//           tagName: 'a',
//           attribs: {
//             href: attribs.href || '#',
//             target: '_blank',
//             rel: 'noopener nofollow'
//           }
//         })
//       },
//       // loại bỏ mọi comment / data-* / class không cần
//       allowedSchemes: ['http', 'https', 'mailto', 'tel'],
//       allowProtocolRelative: false
//     })

//     setCleanHtml(html)
//   } catch (e) {
//     console.error('dumpCleanHtml error:', e)
//   }
// }, [editor])