/*
 * path: components/modals/contents/TableCellViewer.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MediaThumb } from '@/components/media/media-thumb';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { IconTrendingUp } from '@tabler/icons-react';
import { useAppToast } from '@/components/providers/app-toast';
import { plateToHtml } from '@/lib/editorManeger';
import { createArticleOptimistic, updateArticleOptimistic } from '@/hooks/useArticles';
import { DrawerClose, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

type Mode = 'dashboard' | 'create' | 'edit';
type Category = { id: number; name: string; slug?: string };

export function ViewerContent({
    item,
    categories,
    mode = 'dashboard',
    editor,
    descRef,
    onResolve,
    onClose,
}: {
    item: any | null;
    categories: Category[];
    mode?: Mode;
    editor?: any;
    descRef?: any;
    onResolve: (v: void) => void;
    onClose: () => void;
}) {
    const { success, error } = useAppToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: item?.title ?? '',
        slug: item?.slug ?? '',
        category: String(item?.category_id ?? ''),
        status: item?.status ?? '',
    });

    useEffect(() => {
        setForm({
            title: item?.title ?? '',
            slug: item?.slug ?? '',
            category: String(item?.category_id ?? ''),
            status: item?.status ?? '',
        });
    }, [item]);

    const handleChange = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

    async function handleSubmit() {
        setLoading(true);
        try {
            let payload: any = {
                title: form.title,
                slug: form.slug,
                status: form.status,
                category_id: form.category,
            };

            if (mode !== 'dashboard') {
                payload = {
                    ...payload,
                    description: descRef?.current?.getHtml?.(),
                    body: await plateToHtml(editor),
                    content: JSON.stringify(editor?.children ?? []),
                };
            }

            if (mode === 'create') {
                await createArticleOptimistic(payload);
                router.push('/dashboard');
            } else {
                await updateArticleOptimistic(item?.id, payload);
            }

            success();
            onResolve(); // ModalRoot sẽ tự close khi resolve
        } catch (e) {
            error();
            // Nếu muốn giữ mở để sửa lỗi thì comment dòng sau:
            onClose();
        } finally {
            setLoading(false);
        }
    }

    if (!item && mode !== 'create') return null;

    return (
        <>
            <DrawerHeader className="gap-1">
                <DrawerTitle>{item?.title}</DrawerTitle>
                <DrawerDescription>
                    Showing total visitors for the last 6 months
                </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                {/* Header (trước đây là DrawerHeader) */}
                {item?.thumb && (
                    <AspectRatio ratio={16 / 9}>
                        <MediaThumb
                            src={item.thumb}
                            alt={item?.title ?? 'thumbnail'}
                            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </AspectRatio>
                )}

                <Separator />

                {/* Khối “Trending up …” giữ nguyên từ UI cũ */}
                <div className="grid gap-2">
                    <div className="flex gap-2 leading-none font-medium">
                        Trending up by 5.2% this month
                        <IconTrendingUp className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                        Showing total visitors for the last 6 months. This is just some random text to test the layout.
                        It spans multiple lines and should wrap around.
                    </div>
                </div>

                <Separator />

                {/* Form */}
                <form
                    className="flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <div className="flex flex-col gap-3">
                        <Label htmlFor="header">Header</Label>
                        <Input
                            id="header"
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={form.slug}
                            onChange={(e) => handleChange('slug', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-3">
                            <Label>Category</Label>
                            <Select value={form.category} onValueChange={(v) => handleChange('category', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">yes</SelectItem>
                                    <SelectItem value="draft">draft</SelectItem>
                                    <SelectItem value="del">del</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Footer (thay cho DrawerFooter) */}
                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="submit" disabled={loading}>
                            Save
                        </Button>
                        <DrawerClose asChild>
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Done
                            </Button>
                        </DrawerClose>

                    </div>
                </form>
            </div>
        </>
    );
}
