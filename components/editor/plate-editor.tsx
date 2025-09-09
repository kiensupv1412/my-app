'use client';
import { Plate } from '@udecode/plate/react';
import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import sanitizeHtml from 'sanitize-html';
import { ReactEditor } from 'slate-react';


import { SettingsDialog } from '@/components/editor/settings';
import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
export function PlateEditor() {
  const editor = useCreateEditor();
  const [cleanHtml, setCleanHtml] = React.useState('')

  const dumpCleanHtml = React.useCallback(() => {
    try {
      // 1) lấy DOM node của editor
      const root = ReactEditor.toDOMNode(editor as any, editor as any) as HTMLElement
      const clone = root.cloneNode(true) as HTMLElement

      // 2) biến div.slate-p thành <p> chuẩn
      clone.querySelectorAll('div.slate-p').forEach((div) => {
        const p = document.createElement('p')
        p.innerHTML = (div as HTMLElement).innerHTML
          ; (div as HTMLElement).replaceWith(p)
      })

      // 3) lọc trắng: chỉ giữ thẻ/attr văn bản
      const html = sanitizeHtml(clone.innerHTML, {
        allowedTags: [
          'p', 'a', 'strong', 'em', 'u', 's', 'code', 'pre',
          'ul', 'ol', 'li', 'blockquote', 'br',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
        ],
        allowedAttributes: {
          a: ['href', 'rel', 'target'],
          // nếu muốn cho phép class cho styling, thêm ở đây, còn không thì bỏ sạch class
        },
        // ép thêm rel/target an toàn cho link
        transformTags: {
          'a': (tagName, attribs) => ({
            tagName: 'a',
            attribs: {
              href: attribs.href || '#',
              target: '_blank',
              rel: 'noopener nofollow'
            }
          })
        },
        // loại bỏ mọi comment / data-* / class không cần
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        allowProtocolRelative: false
      })

      setCleanHtml(html)
    } catch (e) {
      console.error('dumpCleanHtml error:', e)
    }
  }, [editor])


  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor}
        onChange={dumpCleanHtml}>
        <EditorContainer>
          <Editor variant="demo" />
        </EditorContainer>
        <SettingsDialog />
      </Plate>
    </DndProvider>
  );
}
