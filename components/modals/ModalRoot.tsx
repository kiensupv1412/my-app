/*
 * path: components/modals/ModalRoot.tsx
 */
'use client';

import * as React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { closeModal, resolveModal, useModalStore } from '@/hooks/useMedia';

export default function ModalRoot() {
    const { open, payload } = useModalStore();
    const isMobile = useIsMobile();

    if (!open || !payload) return null;

    const { Comp, props } = payload as any;

    const onResolve = (v: unknown) => { resolveModal(v); closeModal(); };
    const onClose = () => closeModal();

    const title = (Comp as any).displayName || (Comp as any).name || 'Modal';

    return (
        <Drawer open={open} onOpenChange={(v) => !v && closeModal()} direction={isMobile ? 'bottom' : 'right'}>
            <DrawerContent>
                <DrawerHeader className="flex items-center justify-between">
                    <DrawerTitle>{title}</DrawerTitle>
                </DrawerHeader>

                <Comp {...props} onResolve={onResolve} onClose={onClose} />
            </DrawerContent>
        </Drawer>
    );
}