/*
 * path: components/editor/plate-editor.tsx
 */
import * as React from 'react';

import { createPlateEditor, Plate, useEditorRef, useEditorValue, usePlateEditor, usePlateState } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { SettingsDialog } from '@/components/editor/settings-dialog';
import { Editor, EditorContainer } from './ui/editor';
import { BaseEditorKit } from './editor-base-kit';
import { serializeCleanHtml } from '@/lib/serializeCleanHtml';
import { serializeHtml } from 'platejs';

export function PlateEditor({ id }: { id: string }) {
  return (
    <Editor variant="demo" className={id == "description" ? 'pb-20' : ''} />
  );
} 