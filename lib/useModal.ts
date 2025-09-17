/*
 * path: lib/useModal.ts
 */

'use client';
import { useSyncExternalStore } from 'react';

type ModalType = 'viewer' | 'confirm' | 'imagePicker';
type State = { open: boolean; type: ModalType | null; props: any; resolve?: (v: any) => void };

let state: State = { open: false, type: null, props: null };
const listeners = new Set<() => void>();

function setState(p: Partial<State>) {
    state = { ...state, ...p };
    listeners.forEach(l => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
const getSnapshot = () => state;

export function useModalStore() {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function openModal<T extends ModalType>(type: T, props: any) {
    return new Promise<any>((resolve) => setState({ open: true, type, props, resolve }));
}
export function closeModal() { setState({ open: false, type: null, props: null, resolve: undefined }); }
export function resolveModal(value: any) {
    state.resolve?.(value);
    closeModal();
}
