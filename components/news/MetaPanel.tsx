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
import { handlePreview, plateToHtml } from "@/lib/editorManeger";
import { createArticleOptimistic, updateArticleOptimistic } from "@/hooks/use-articles";
import { useRouter } from 'next/navigation'
import PickThumb from "./PickThumb";
import { normalizeSlug, safeStringify } from "@/lib/utils";
import { z } from 'zod';
import { apiUpload } from "@/lib/media.api";

const FormSchema = z.object({
    title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(160),
    slug: z.string().trim().min(1, 'Slug bắt buộc').max(160).regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa [a-z0-9-]'),
    category_id: z.string().min(1, 'Chọn chuyên mục'),
    status: z.enum(STATUS, { errorMap: () => ({ message: 'Trạng thái không hợp lệ' }) }),
});
type ThumbState = {
    id: number | null;
    url: string;
    blob?: Blob | null;
    is_background?: boolean; // có phải ảnh nền để mới cho phép generate title
};
export function MetaPanel({ mode, article, categories, descEditor, contentEditor }:
    { mode: Mode, article: Article | null, categories: Categories, descEditor: any, contentEditor: any }) {

    const router = useRouter()
    const { success, error } = useAppToast()

    const [thumb, setThumb] = useState<ThumbState>({
        id: article?.thumb?.id ?? null,
        url: article?.thumb?.file_url ?? '/thumb-1920x1080.png',
        blob: null,
        is_background: article?.thumb?.is_background ?? false,
    });

    const [genBusy, setGenBusy] = useState(false);
    const [tempBlob, setTempBlob] = useState<Blob | null>(null);

    const initialForm = useMemo(() => ({
        title: article?.title ?? '',
        slug: article?.slug ?? '',
        category_id: String(article?.category_id ?? ''),
        status: article?.status ?? 'draft',
    }), [article]);
    useEffect(() => {
        if (article?.thumb) {
            setThumb({
                id: article.thumb.id,
                url: article.thumb.file_url,
                blob: null,
                is_background: article.thumb.is_background ?? false,
            });
        } else {
            setThumb({
                id: null,
                url: '/thumb-1920x1080.png',
                blob: null,
                is_background: true,
            });
        }
    }, [article?.thumb?.id]);
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
        setThumb({
            id: media?.id ?? null,
            url: media?.file_url ?? '/thumb-1920x1080.png',
            blob: null,
            is_background: media?.is_background ?? false,
        });
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
        let finalThumbId = thumb.id ?? undefined;
        if (thumb.id === null && thumb.blob) {
            try {
                const file = new File([thumb.blob], `og-${Date.now()}.png`, { type: 'image/png' });
                const uploaded = await apiUpload([file], { folder_id: null });
                const item = uploaded?.[0];
                if (item && Number.isFinite(item.id)) {
                    finalThumbId = item.id;
                    // optional: cập nhật lại state thumb sang server URL
                    setThumb({ id: item.id, url: item.file_url, blob: null });
                } else {
                    throw new Error('Upload OK nhưng không nhận được id media hợp lệ');
                }
            } catch (err) {
                console.error('Upload thumbnail thất bại', err);
            }
        }
        return {
            title: form.title.trim(),
            slug: normalizeSlug(form.slug),
            status: form.status,
            category_id: Number(form.category_id),
            thumb_id: finalThumbId,
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

    async function handleGenerateTitle() {
        if (!form.title?.trim()) {
            error('Tiêu đề đang trống');
            return;
        }
        if (!thumb.is_background) {
            error('Không phải là ảnh nền');
            return;
        }
        try {
            setGenBusy(true);
            const blob = await generateImageOnClient({
                inputSrc: thumb.url,
                title: form.title.trim(),
                opts: { padding: 72, fontSize: 72, brandText: 'tuvibattu.vn', addGradient: true },
            });

            const url = URL.createObjectURL(blob);
            setThumb({ id: null, url, blob }); // reset id vì đây là ảnh local
            success('Đã tạo ảnh preview từ tiêu đề');
        } catch (e: any) {
            error(e?.message ?? 'Generate thất bại');
        } finally {
            setGenBusy(false);
        }
    }

    return (
        <div className='w-[500px]'>
            <div>
                <div className="gap-1">
                    <div>
                        Showing total visitors for the last 6 months
                    </div>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    <PickThumb
                        thumb={thumb.id ? { id: thumb.id, file_url: thumb.url } : null}
                        onConfirmAction={handleConfirmThumb}
                        fallbackUrl="/thumb-1920x1080.png"
                        overrideTriggerUrl={thumb.url}
                    />
                    <Button
                        type="button"
                        onClick={handleGenerateTitle}
                        disabled={genBusy}
                    >
                        {genBusy ? 'Đang tạo…' : 'GenerateTitle'}
                    </Button>                    <Separator />
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
                            <Label htmlFor="header">Title</Label>
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
                            <div>
                                <Button type="button" variant="outline"
                                    onClick={() => { handlePreview(contentEditor) }}>
                                    Xem Trước
                                </Button>
                            </div>
                            <div>
                                <Button type="button" variant="outline"
                                    onClick={
                                        () => {
                                            setForm({ ...form, status: "draft" });
                                            handleSubmit();
                                        }}>
                                    Lưu nháp
                                </Button>
                            </div>
                            <Button type="button"
                                onClick={handleSubmit}
                                disabled={!form.title || !form.slug || !form.category_id || isSubmittingRef.current}>
                                {isSubmittingRef.current ? 'Đang lưu…' : (mode === 'create' ? 'Tạo bài' : 'Cập nhật')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    )
}

async function generateImageOnClient(params: {
    inputSrc: string;
    title: string;
    opts?: GenOptions;
}): Promise<Blob> {
    const {
        padding = 80,
        fontSize = 120,
        lineHeight = 1.3,
        textColor = '#000',
        fontFamily = 'Inter, system-ui, Arial',
    } = params.opts || {};

    const img = await loadImage(params.inputSrc);

    // canvas tự theo size ảnh input
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // vẽ ảnh gốc full khung
    ctx.drawImage(img, 0, 0, width, height);

    // vẽ title
    const boxX = padding;
    const boxW = width - padding * 2;

    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    ctx.font = `700 ${fontSize}px ${fontFamily}`;

    const lines = wrapByMeasure(ctx, params.title, boxW);
    const lh = Math.round(fontSize * lineHeight);
    const textBlockH = lines.length * lh;
    let y = (height - textBlockH) / 2;

    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    for (const line of lines) {
        ctx.fillText(line, boxX, y);
        y += lh;
    }

    const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.92)
    );
    return blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
        const img = new Image();
        if (/^https?:\/\//i.test(src)) img.crossOrigin = 'anonymous'; // cần CORS khi URL ngoài
        img.onload = () => res(img);
        img.onerror = () => rej(new Error('Không tải được ảnh (CORS hoặc URL sai).'));
        img.src = src;
    });
}

function wrapByMeasure(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = (text || '').split(/\s+/);
    const lines: string[] = [];
    let line = '';

    for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width <= maxWidth) {
            line = t;
        } else {
            if (line) lines.push(line);
            if (ctx.measureText(w).width > maxWidth) {
                let cur = '';
                for (const ch of w) {
                    const t2 = cur + ch;
                    if (ctx.measureText(t2).width <= maxWidth) cur = t2;
                    else {
                        if (cur) lines.push(cur);
                        cur = ch;
                    }
                }
                line = cur;
            } else {
                line = w;
            }
        }
    }
    if (line) lines.push(line);
    return lines.slice(0, 6);
}