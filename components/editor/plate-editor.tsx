/*
 * path: components/editor/plate-editor.tsx
 */

'use client';

import * as React from 'react';

import { createPlateEditor, Plate, useEditorRef, useEditorValue, usePlateEditor } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { SettingsDialog } from '@/components/editor/settings-dialog';
import { Editor, EditorContainer } from './ui/editor';
import { BaseEditorKit } from './editor-base-kit';
import { serializeCleanHtml } from '@/lib/serializeCleanHtml';
import { serializeHtml } from 'platejs';

// function Logger() {
//   const value = useEditorValue()
//   React.useEffect(() => {
//     ;(async () => {
//       try {
//         const serializeEditor = createPlateEditor({
//           plugins: BaseEditorKit,
//           value, 
//         })
//         const html = await serializeHtml(serializeEditor)
//         // console.log("🚀 ~ Logger ~ html:", html)
//         // console.log('[Plate HTML]', serializeCleanHtml(html))
//       } catch (e) {
//         console.error('serializeHtml(BaseEditorKit) error:', e)
//       }
//     })()
//   }, [value])

//   return null
// }
import { parseHtmlElement } from 'platejs';

type PlateEditorProps = {
  mode: 'create' | 'edit';
  content?: any;
};


export function PlateEditor({ mode, content }: PlateEditorProps) {

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: [],
  });

  React.useEffect(() => {
    if (mode === 'edit' && content) {
      try {
        const element = parseHtmlElement(content);
        const nodes = editor.api.html.deserialize({ element });
        editor.tf.setValue(nodes);
      } catch (e) {
      }
    } else if (mode === 'create') {
      editor.tf.setValue([]);
    }
  }, [mode, content, editor]);


  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor variant="demo" />
      </EditorContainer>
      {/* <SettingsDialog /> */}
    </Plate>
  );
}