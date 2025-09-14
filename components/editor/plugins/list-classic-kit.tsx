// components/editor/plugins/list-classic-kit.tsx
'use client'
import {
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
  TaskListPlugin,
  ListItemPlugin,
} from '@platejs/list-classic/react'
import { KEYS } from 'platejs'
import { BlockList } from '../ui/block-list'
import { IndentKit } from '@/components/editor/plugins/indent-kit';

export const ListClassicKit = [
  ...IndentKit,
  ListPlugin.configure({
    inject: {
      targetPlugins: [
        ...KEYS.heading,
        KEYS.p,
        KEYS.blockquote,
        KEYS.codeBlock,
        KEYS.toggle,
        KEYS.img,
      ],
    },
    render: {
      belowNodes: BlockList as any,  
    },
  }),
  BulletedListPlugin,
  NumberedListPlugin,
  TaskListPlugin,
  ListItemPlugin,
]