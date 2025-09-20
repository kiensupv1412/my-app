'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { IconChevronLeft, IconPlus } from '@tabler/icons-react';
import { UploadMediaDialog } from './upload-media-dialog';

type Props = {
    // trạng thái hiện tại
    currentFolderId: number | null;
    currentFolderName?: string | null;

    // khi bấm Back: root-page sẽ setCurrentFolderId(null),
    // còn /media/[id] sẽ router.push('/media')
    onBack?: () => void;

    // nơi upload sẽ đổ vào (nếu không truyền, mặc định dùng currentFolderId)
    uploadTargetFolderId?: number | null;

    // callback sau khi upload xong
    onUploaded: () => void;
};

/**
 * GỘP 2 header thành 1 — GIỮ NGUYÊN UI HIỆN TẠI
 * - Nếu không có onBack và currentFolderId === null  -> UI "All media" không nút back
 * - Ngược lại                                         -> UI có nút back + trail "/ {folder name}"
 */
export function FolderHeader({
    currentFolderId,
    currentFolderName,
    onBack,
    uploadTargetFolderId,
    onUploaded,
}: Props) {
    const targetId = uploadTargetFolderId ?? currentFolderId;

    // CASE 1: Trang root, đang ở "All media" (KHÔNG back button)
    if (!onBack && currentFolderId === null) {
        return (
            <div className="flex justify-between">
                <div className="flex items-center">
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium">All media</span>
                    </div>
                </div>
                <UploadMediaDialog
                    currentFolderId={targetId}
                    onUploaded={onUploaded}
                >
                    <Button variant="outline" size="sm">
                        <IconPlus />
                        <span className="hidden lg:inline">Upload Image</span>
                    </Button>
                </UploadMediaDialog>
            </div>
        );
    }

    // CASE 2: Có nút Back (root đang ở trong folder HOẶC trang /media/[id])
    return (
        <div className="flex justify-between">
            <div className="flex items-center">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onBack}
                    className="gap-1"
                >
                    <IconChevronLeft className="h-4 w-4" />
                    All media
                </Button>
                <div className="text-sm text-muted-foreground">
                    <span className="mx-2">/</span>
                    <span className="font-medium">{currentFolderName ?? ''}</span>
                </div>
            </div>
            <UploadMediaDialog
                currentFolderId={targetId}
                onUploaded={onUploaded}
            >
                <Button variant="outline" size="sm">
                    <IconPlus />
                    <span className="hidden lg:inline">Upload Image</span>
                </Button>
            </UploadMediaDialog>
        </div>
    );
}

export default FolderHeader;