/*
 * path: components/editor/plate-editor.tsx
 */
import * as React from 'react';
import { Editor } from './ui/editor';

export function PlateEditor({ id }: { id: string }) {
  return (
    <Editor variant="demo" className={id == "description" ? 'pb-20' : ''} />
  );
} 