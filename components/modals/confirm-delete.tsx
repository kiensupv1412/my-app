/*
 * path: components/modals/confirm-delete.tsx
 */

'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogPortal,   // 👈 thêm
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { IconTrash } from '@tabler/icons-react';
import { X } from 'lucide-react';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    className?: string;
};

export function ConfirmDeleteModal({
    open,
    onOpenChange,
    onConfirm,
    title,
    description = 'Are you sure you would like to do this?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    loading = false,
    className,
}: Props) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogPortal>
                <AlertDialogContent
                    className={cn(
                        'w-[90vw] max-w-md rounded-2xl p-0 shadow-xl',
                        'bg-white dark:bg-neutral-900',
                        className
                    )}
                >
                    {/* Nút X góc phải */}
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </button>

                    {/* Header */}
                    <AlertDialogHeader className="px-6 pt-6">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20">
                            <IconTrash className="size-6" />
                        </div>

                        <AlertDialogTitle className="mx-auto text-center text-xl font-semibold">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mx-auto mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Footer */}
                    <AlertDialogFooter className="flex flex-row justify-end gap-3 px-6 pb-6 pt-4">
                        <AlertDialogCancel
                            className={cn(
                                'h-10 w-40 rounded-sm border px-5 text-[15px] font-medium',
                                'bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800'
                            )}
                            disabled={loading}
                        >
                            {cancelText}
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={() => onConfirm()}
                            disabled={loading}
                            className={cn(
                                'h-10 w-40 rounded-sm bg-red-600 px-5 text-[15px] font-semibold text-white hover:bg-red-700',
                                'disabled:opacity-50'
                            )}
                        >
                            {loading ? 'Deleting…' : confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogPortal>
        </AlertDialog>
    );
}