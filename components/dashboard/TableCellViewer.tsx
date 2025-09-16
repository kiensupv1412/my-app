/*
* path: components/dashboard/TableCellViewer.tsx
*/
'use client';
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "../ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { IconTrendingUp } from "@tabler/icons-react"
import { AspectRatio } from "../ui/aspect-ratio"
import { Skeleton } from "@/components/ui/skeleton"
import { postData, putData } from "@/lib/api";

import { MediaThumb } from "../media/media-thumb"
import { useEffect, useMemo, useState } from "react";
import { useAppToast } from "../providers/app-toast";
import { Description } from "@radix-ui/react-dialog";
import { createPlateEditor, useEditorRef, useEditorValue } from 'platejs/react';
import { serializeHtml } from "platejs";
import { BaseEditorKit } from "../editor/editor-base-kit";
import { serializeCleanHtml } from "@/lib/serializeCleanHtml";
import React from "react";
import { plateToHtml } from "@/lib/editorManeger";

type Category = { id: string; name: string };
type Props = {
    mode: any,
    item: any;
    categories: Category[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    descRef?: any,
    editor?: any
};

export function TableCellViewer({ mode, editor, item, categories, open, onOpenChange, descRef }: Props) {
    const isMobile = useIsMobile()
    const { success, error } = useAppToast();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: item?.title ?? "",
        slug: item?.slug ?? "",
        category: String(item?.category_id ?? ""),
        status: item?.status ?? "",
    });
    useEffect(() => {
        setForm({
            title: item?.title ?? "",
            slug: item?.slug ?? "",
            category: String(item?.category_id) ?? "",
            status: item?.status ?? "",
        });
    }, [item]);

    const handleChange = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    async function handleSubmit() {
        let payload = {
            title: form.title,
            slug: form.slug,
            status: form.status,
            category_id: form.category,
        };

        if (mode !== "dashboard") {
            payload = {
                ...payload,
                description: descRef.current?.getHtml(),
                body: await plateToHtml(editor),
                content: JSON.stringify(editor.children),
            }
        }
        try {
            if (mode == "create") {
                await postData(`/article`, payload);
            }

            if (mode == "edit" || mode == "dashboard") {
                await putData(`/article/update/${item?.id}`, payload);
            }
            success()
        } catch (err) {
            error()
        } finally {
            onOpenChange?.(false)
        }

    }

    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            direction={isMobile ? "bottom" : "right"}>
            <DrawerTrigger asChild>
                <Button variant="link" className="text-foreground w-fit px-0 text-left whitespace-normal">
                    {onOpenChange ? null : item?.title}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle>{item?.title}</DrawerTitle>
                    <DrawerDescription>
                        Showing total visitors for the last 6 months
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    <AspectRatio ratio={16 / 9}>
                        <MediaThumb
                            src={item?.thumb}
                            alt="Photo by Drew Beamer"
                            className="h-full w-full rounded-lg object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                        {/* < Skeleton className="h-full w-full" /> */}
                    </AspectRatio>
                    <Separator />
                    <div className="grid gap-2">
                        <div className="flex gap-2 leading-none font-medium">
                            Trending up by 5.2% this month
                            <IconTrendingUp className="size-4" />
                        </div>
                        <div className="text-muted-foreground">
                            Showing total visitors for the last 6 months. This is just
                            some random text to test the layout. It spans multiple lines
                            and should wrap around.
                        </div>
                    </div>
                    <Separator />
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
                    >
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="header">Header</Label>
                            <Input
                                id="header"
                                value={form.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={form.slug}
                                onChange={(e) => handleChange("slug", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="category">Category</Label>
                                <Select value={form.category}
                                    onValueChange={(val) => handleChange("category", val)}>
                                    <SelectTrigger id="category" className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Label htmlFor="status">Status</Label>
                                <Select value={form.status}
                                    onValueChange={(val) => handleChange("status", val)}>
                                    <SelectTrigger id="status" className="w-full">
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
                    </form>
                </div>

                <DrawerFooter>
                    <Button onClick={handleSubmit} disabled={loading}></Button>
                    <DrawerClose asChild>
                        <Button variant="outline" disabled={loading}>Done</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
