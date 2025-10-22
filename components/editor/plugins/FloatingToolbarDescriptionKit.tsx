'use client';

import { createPlatePlugin } from 'platejs/react';

import { FloatingToolbar } from '../ui/floating-toolbar';
import { FloatingToolbarDescription } from '../ui/FloatingToolbarDescription';

export const FloatingToolbarDescriptionKit = [
    createPlatePlugin({
        key: 'floating-toolbar',
        render: {
            afterEditable: () => (
                <FloatingToolbar>
                    <FloatingToolbarDescription />
                </FloatingToolbar>
            ),
        },
    }),
];
