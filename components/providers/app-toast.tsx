'use client'

import {
    ToastProvider as RadixToastProvider,
    Toast,
    ToastClose,
    ToastDescription,
    ToastTitle,
    ToastViewport,
} from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import * as React from 'react'

type ToastType = 'success' | 'error'
type ToastItem = {
    id: string
    type: ToastType
    title?: string
    description?: string
    open: boolean
}

const AppToastCtx = React.createContext<{
    success: (title?: string, description?: string) => void
    error: (title?: string, description?: string) => void
} | null>(null)

export function useAppToast() {
    const ctx = React.useContext(AppToastCtx)
    if (!ctx) throw new Error('useAppToast must be used within <AppToastProvider>')
    return ctx
}

export function AppToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<ToastItem[]>([])

    const push = React.useCallback((type: ToastType, title: string, description?: string) => {
        const id = crypto.randomUUID()
        setToasts((t) => [...t, { id, type, title, description, open: true }])
    }, [])

    const success = (title: string, description?: string) => push('success', title, description)
    const error = (title: string, description?: string) => push('error', title, description)

    const onOpenChange = (id: string, open: boolean) => {
        if (!open) setToasts((t) => t.filter((x) => x.id !== id))
        else setToasts((t) => t.map((x) => (x.id === id ? { ...x, open } : x)))
    }

    return (
        <AppToastCtx.Provider value={{ success, error }}>
            <RadixToastProvider swipeDirection="right" duration={3000}>
                {children}

                {/* 👇 vị trí góc trên phải */}
                <ToastViewport />

                {toasts.map((t) => {
                    const isSuccess = t.type === 'success'
                    const isError = t.type === 'error'
                    return (
                        <Toast
                            key={t.id}
                            open={t.open}
                            onOpenChange={(o) => onOpenChange(t.id, o)}
                            className={cn(
                                isSuccess && 'border-0 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-50',
                                isError && 'border-0 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-50'
                            )}
                        >
                            {isSuccess && <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />}
                            {isError && <XCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />}

                            <div className="flex-1">
                                <ToastTitle className="font-medium">
                                    {isSuccess ? 'Thành công' : 'Thất bại'} — {t.title}
                                </ToastTitle>
                                {t.description && <ToastDescription>{t.description}</ToastDescription>}
                            </div>

                            <ToastClose />
                        </Toast>
                    )
                })}
            </RadixToastProvider>
        </AppToastCtx.Provider>
    )
}