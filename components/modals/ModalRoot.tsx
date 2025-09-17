'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { useModalStore, closeModal, resolveModal } from '@/lib/useModal';
import { useIsMobile } from '@/hooks/use-mobile';
// import TableCellViewer from './contents/TableCellViewer';
const TableCellViewer = dynamic(
    () => import('./contents/TableCellViewer').then(m => m.ViewerContent),
    { ssr: false }
);
const PickThumb = dynamic(
    () => import('./contents/pickThumb').then(m => m.default),
    { ssr: false }
);
const registry = {
    viewer: { Component: TableCellViewer, title: 'Viewer' },
    imagePicker: { Component: PickThumb, title: 'Chọn thumbnail', withWrapperHeader: false },
} as const;

export default function ModalRoot() {
    const isMobile = useIsMobile();
    const pathname = usePathname();
    const { open, type, props } = useModalStore();

    React.useEffect(() => { if (open) closeModal(); }, [pathname]);

    if (!type) return null;

    const entry = (registry as any)[type];
    if (!entry) {
        closeModal();
        return null;
    }

    const { Component } = entry;

    const content = (
        <Component
            {...props}
            onResolve={(v: unknown) => {
                resolveModal(v);
                closeModal();
            }
            }
            onClose={() => closeModal()}
        />
    );

    return (
        <Drawer
            open={open}
            onOpenChange={(v) => { if (!v) closeModal(); }}
            direction={isMobile ? 'bottom' : 'right'}>
            <DrawerContent  >
                <DrawerTitle></DrawerTitle> {/*    giữ nguyên hoặc truyền cho nó 1 title sẽ hết lỗi */}
                {content}
            </DrawerContent>
        </Drawer >
    );
}
