/*
 * path: hooks/useModal.ts
 */

'use client';

import React from 'react';
import { useSyncExternalStore } from 'react';

type ResolveFn = (v: unknown) => void;

type ModalPayload<P = any> = {
    Comp: React.ComponentType<P>;
    props: P;
};

type State = {
    open: boolean;
    payload?: ModalPayload | null;
    resolve?: ResolveFn;
};

let state: State = { open: false, payload: null };
const listeners = new Set<() => void>();

function setState(p: Partial<State>) {
    state = { ...state, ...p };
    listeners.forEach(l => l());
}

export function useModalStore() {
    return useSyncExternalStore(
        (l) => (listeners.add(l), () => listeners.delete(l)),
        () => state,
        () => state
    );
}

export function openModal<P>(
    Comp: React.ComponentType<P>,
    props: Omit<P, 'onResolve' | 'onClose'>
) {
    return new Promise<unknown>((resolve) => {
        setState({ open: true, payload: { Comp, props: props as P }, resolve });
    });
}

export function resolveModal(v?: unknown) {
    const resolver = state.resolve;
    setState({ open: false, payload: null, resolve: undefined });
    resolver?.(v);
}

export function closeModal(v?: unknown) {
    if (v !== undefined) state.resolve?.(v);
    setState({ open: false, payload: null, resolve: undefined });
}