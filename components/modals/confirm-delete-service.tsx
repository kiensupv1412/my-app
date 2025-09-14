'use client';

import { createRoot } from 'react-dom/client';
import React from 'react';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete';

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

export function confirmDelete(opts: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
}): Promise<boolean> {
    if (!container) {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    }

    return new Promise((resolve) => {
        function handleClose(result: boolean) {
            resolve(result);
            root?.render(<></>); // clear modal sau khi đóng
        }

        root?.render(
            <ConfirmDeleteModal
                open={true}
                onOpenChange={(open) => {
                    if (!open) handleClose(false);
                }}
                onConfirm={() => handleClose(true)}
                title={opts.title}
                description={opts.description}
                confirmText={opts.confirmText ?? 'Delete'}
                cancelText={opts.cancelText ?? 'Cancel'}
            />
        );
    });
}