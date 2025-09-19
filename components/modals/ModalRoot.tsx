'use client';

import * as React from 'react';
import { closeModal, resolveModal, useModalStore } from '@/hooks/useModal';

export default function ModalRoot() {
    const { open, payload } = useModalStore();
    if (!open || !payload) return null;

    const { Comp, props } = payload as any;

    const userOnResolve = props?.onResolve as ((v: unknown) => void) | undefined;
    const userOnClose = props?.onClose as (() => void) | undefined;

    const onResolve = (v: unknown) => {
        try {
            userOnResolve?.(v);
        } catch (e) {
            console.error('[ModalRoot] userOnResolve error:', e);
        } finally {
            resolveModal(v);
        }
    };

    const onClose = () => {
        try {
            userOnClose?.();
        } catch (e) {
            console.error('[ModalRoot] userOnClose error:', e);
        } finally {
            closeModal();
        }
    };

    return (
        <Comp
            {...props}
            open={open}
            onResolve={onResolve}
            onClose={onClose}
        />
    );
}