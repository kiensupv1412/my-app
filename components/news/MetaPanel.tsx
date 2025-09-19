'use client'
import { IconTrendingUp } from "@tabler/icons-react";
import { MediaThumb } from "../media/media-thumb";
import { AspectRatio } from "../ui/aspect-ratio";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Article, ArticleUpdatePayload, Categories, MediaItem, Mode, STATUS } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppToast } from "../providers/app-toast";
import { plateToHtml } from "@/lib/editorManeger";
import { createArticleOptimistic, updateArticleOptimistic } from "@/hooks/useArticles";
import { useRouter } from 'next/navigation'
import PickThumb from "./PickThumb";
import { normalizeSlug, safeStringify } from "@/lib/utils";
import { z } from 'zod';

// const STATUS = ['draft', 'del', 'yes'] as const;
// type Status = typeof STATUS[number];

const FormSchema = z.object({
    title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(160),
    slug: z.string().trim().min(1, 'Slug bắt buộc').max(160).regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa [a-z0-9-]'),
    category_id: z.string().min(1, 'Chọn chuyên mục'),
    status: z.enum(STATUS, { errorMap: () => ({ message: 'Trạng thái không hợp lệ' }) }),
});

export function MetaPanel({ mode, article, categories, descEditor, contentEditor }:
    { mode: Mode, article: Article | null, categories: Categories, descEditor: any, contentEditor: any }) {

    const router = useRouter()
    const { success, error } = useAppToast()

    const [thumbId, setThumbId] = useState<number | null>()

    const initialForm = useMemo(() => ({
        title: article?.title ?? '',
        slug: article?.slug ?? '',
        category_id: String(article?.category_id ?? ''),
        status: article?.status ?? 'draft',
    }), [article]);

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        setForm({
            title: article?.title ?? '',
            slug: article?.slug ?? '',
            category_id: String(article?.category_id ?? ''),
            status: article?.status ?? 'draft',
        });
        setThumbId(null);
        setErrors({});
    }, [article, categories])

    useEffect(() => {
        if (!form.title) return;
        const auto = normalizeSlug(form.title);
        if (!form.slug || form.slug === normalizeSlug(article?.title ?? '')) {
            setForm(p => ({ ...p, slug: auto }));
        }
    }, [form.title]);

    const handleChange = (k: keyof typeof form, v: string) => {
        setForm(prev => ({ ...prev, [k]: v }));
        setErrors(prev => ({ ...prev, [k]: undefined }));
    };

    const handleConfirmThumb = (media: MediaItem | undefined) => {
        setThumbId(media?.id ?? null);
    };

    async function buildPayload(): Promise<ArticleUpdatePayload> {
        const descJson = safeStringify(descEditor?.children ?? []);
        const contentJson = safeStringify(contentEditor?.children ?? []);
        let descHtml: string | null = null;
        let contentHtml: string | null = null;
        try {
            descHtml = await plateToHtml(descEditor);
        } catch {
            descHtml = null;
        }
        try {
            contentHtml = await plateToHtml(contentEditor);
        } catch {
            contentHtml = null;
        }

        return {
            title: form.title.trim(),
            slug: normalizeSlug(form.slug),
            status: form.status,
            category_id: Number(form.category_id),
            thumb_id: thumbId ?? undefined,
            content: contentJson,
            description: descJson,
            content_html: contentHtml,
            description_html: descHtml,
        };
    }


    async function handleSubmit() {
        if (isSubmittingRef.current) return;
        const parsed = FormSchema.safeParse(form);
        if (!parsed.success) {
            const e: any = {};
            for (const issue of parsed.error.issues) {
                const k = issue.path[0] as keyof typeof form;
                e[k] = issue.message;
            }
            setErrors(e);
            error('Vui lòng kiểm tra lại các trường dữ liệu.');
            return;
        }

        isSubmittingRef.current = true;

        try {

            const payload = await buildPayload();

            if (mode == "create") {
                await createArticleOptimistic(payload);
                success('Đã tạo bài viết');
                router.push('/news');
            } else {
                await updateArticleOptimistic(String(article?.id), payload);
                success('Đã cập nhật bài viết');
                router.push('/news');
            }
        } catch (e: any) {
            error(e?.message ?? 'Lưu thất bại');
        } finally {
            isSubmittingRef.current = false;
        }
    }

    return (
        <div className='w-[400px]'>
            <div>
                <div className="gap-1">
                    <div>
                        Showing total visitors for the last 6 months
                    </div>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    <PickThumb
                        thumb={article?.thumb}
                        onConfirmAction={handleConfirmThumb}
                    />
                    {thumbId ? `Đã chọn #${thumbId}` : 'Chọn thumbnail'}
                    <Separator />
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
                                value={form?.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={form?.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                            />
                            {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug}</p>}
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="flex flex-1 flex-col gap-3">
                                <Label>Category</Label>
                                <Select value={String(form?.category_id)}
                                    onValueChange={(v) => handleChange('category_id', v)}>
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
                                {errors.category_id && <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>}
                            </div>

                            <div className="flex flex-1 flex-col gap-3">
                                <Label>Status</Label>
                                <Select value={form?.status}
                                    onValueChange={(v) => handleChange('status', v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button"
                                onClick={handleSubmit}
                                disabled={!form.title || !form.slug || !form.category_id || isSubmittingRef.current}
                            >
                                {isSubmittingRef.current ? 'Đang lưu…' : (mode === 'create' ? 'Tạo bài' : 'Cập nhật')}
                            </Button>
                            <div  >
                                <Button type="button" variant="outline"
                                    onClick={
                                        () => {
                                            setForm({ ...form, status: "draft" });
                                            handleSubmit();
                                        }}>
                                    Lưu nháp
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    )
}