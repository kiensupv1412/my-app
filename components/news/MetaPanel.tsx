'use client'
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Article, ArticleUpdatePayload, Categories, MediaItem, Mode, STATUS } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { handlePreview, plateToHtml } from "@/lib/editorManeger";
import { useRouter } from 'next/navigation'
import PickThumb from "./PickThumb";
import { normalizeSlug, safeStringify } from "@/lib/utils";
import { z } from 'zod';
import { toast } from "sonner";
import { TagInput } from "../ui/tag-input";
import { checkSlugExists, createArticle, updateArticle } from "@/lib/api";
import { apiUploadMedia } from "@/lib/api";
import { useSession } from "next-auth/react";

const FormSchema = z.object({
    title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(160),
    slug: z.string().trim().min(1, 'Slug bắt buộc'),
    category_id: z.string().min(1, 'Chọn chuyên mục'),
    status: z.enum(STATUS, { errorMap: () => ({ message: 'Trạng thái không hợp lệ' }) }),
});


export function MetaPanel({ mode, article, categories, descEditor, contentEditor }:
    { mode: Mode, article: Article | null, categories: Categories, descEditor: any, contentEditor: any }) {

    const DEFAULT_THUMB_URL = '/thumb-1920x1080.png';

    const { data: session } = useSession();
    const token = session?.accessToken ?? null;

    const router = useRouter();

    const initialForm = useMemo(
        () => ({
            title: article?.title ?? '',
            slug: article?.slug ?? '',
            category_id: String(article?.category_id ?? ''),
            status: article?.status ?? 'draft',
        }),
        [article, categories]
    );
    const [thumb, setThumb] = useState<MediaItem | undefined>(article?.thumb ?? undefined);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
    const [genBusy, setGenBusy] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tags, setTags] = useState([]);


    useEffect(() => {
        setForm(initialForm);
        setThumb(article?.thumb ?? undefined);
        setErrors({});
    }, [initialForm, article]);
    const handleChange = (k: keyof typeof form, v: string) => {
        setForm((prev) => ({ ...prev, [k]: v }));
        setErrors((prev) => ({ ...prev, [k]: undefined }));
    };

    const handleConfirmThumb = (media?: MediaItem) => {
        setThumb(media);
    };

    const ensureThumbId = async (): Promise<number | undefined> => {
        if (thumb?.id != null) return thumb.id;
        if (!thumb?.file_url) return undefined;

        try {
            const file = new File([thumb?.file_url], `og-${Date.now()}.png`, { type: 'image/png' });
            const uploaded = await apiUploadMedia([file], { folder_id: null });
            const item = uploaded?.[0];
            if (item && Number.isFinite(item.id)) {
                setThumb((t) => ({ ...t, id: item.id, file_url: item.file_url, blob: null } as MediaItem));
                return item.id;
            }
            throw new Error('Upload OK nhưng không nhận được id media hợp lệ');
        } catch (err) {
            console.error('Upload thumbnail thất bại', err);
            return undefined;
        }
    };
    async function buildPayload(): Promise<ArticleUpdatePayload> {
        const descJson = safeStringify(descEditor?.children ?? []);
        const contentJson = safeStringify(contentEditor?.children ?? []);

        // render HTML song song, không vỡ nếu 1 cái fail
        const [descRes, contentRes] = await Promise.allSettled([
            plateToHtml(descEditor),
            plateToHtml(contentEditor),
        ]);
        const descHtml = descRes.status === 'fulfilled' ? descRes.value : null;
        const contentHtml = contentRes.status === 'fulfilled' ? contentRes.value : null;

        const finalThumbId = await ensureThumbId();

        const availableSlug = await checkSlugExists(form.slug, article?.id, token);
        if (!availableSlug.available)
            return Promise.reject(new Error('Lỗi kiểm tra slug tồn tại'));

        return {
            title: form.title.trim(),
            slug: availableSlug.slug,
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
        if (isSubmitting) return;

        const parsed = FormSchema.safeParse(form);
        if (!parsed.success) {
            const fieldErrors: any = {};
            for (const issue of parsed.error.issues) {
                const k = issue.path[0] as keyof typeof form;
                fieldErrors[k] = issue.message;
            }
            setErrors(fieldErrors);
            toast.error('Vui lòng kiểm tra lại các trường dữ liệu.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = await buildPayload();
            const isCreate = mode === 'create';

            if (isCreate) {
                await createArticle(payload, token);
                toast.success('Đã tạo bài viết');
                router.push('/news');
            } else {
                await updateArticle(String(article?.id), payload, token);
                toast.success('Đã cập nhật bài viết');
            }
        } catch (e: any) {
            toast.error(e?.message ?? 'Lưu thất bại');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function uploadGeneratedBlob(
        blob: Blob,
        {
            file_name = 'generated-' + Date.now() + '.png',
        }: { file_name?: string; } = {}
    ) {
        const formData = new FormData();
        const file = new File([blob], file_name, { type: blob.type || 'image/png' });
        formData.append('file', file, file.name);

        const res = await apiUploadMedia([file], { token });
        if (!res || !res.length || !res[0].id) throw new Error('Upload không thành công');
        return res[0];
    }

    function slugify(s: string) {
        return s
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    async function handleGenerateTitle() {
        if (!form.title?.trim()) return toast.error('Tiêu đề đang trống');
        if (!thumb?.is_background) return toast.error('Không phải là ảnh nền');

        try {
            setGenBusy(true);
            const blob = await generateImageOnClient({
                inputSrc: thumb.file_url,
                title: form.title.trim(),
                opts: { padding: 72, fontSize: 72, brandText: 'tuvibattu.vn', addGradient: true },
            });

            const uploaded = await uploadGeneratedBlob(blob, {
                file_name: 'share-' + slugify(form.title) + '.png',
            });
            setThumb(uploaded as MediaItem);
            toast.success('Đã tạo ảnh preview từ tiêu đề');
        } catch (e: any) {
            toast.error(e?.message ?? 'Generate thất bại');
        } finally {
            setGenBusy(false);
        }
    }

    async function fetchTags(q: string) {
        const res = await fetch(`http://localhost:4000/article/tags/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        return data ?? [];
    }
    return (
        <div className='w-[500px]'>
            <div>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    <PickThumb
                        thumb={thumb?.id ? { id: thumb.id, file_url: thumb.file_url, is_background: thumb.is_background } as MediaItem : undefined}
                        onConfirmAction={handleConfirmThumb}
                        fallbackUrl={DEFAULT_THUMB_URL}
                        overrideTriggerUrl={thumb?.file_url}
                    />
                    <Button type="button" onClick={handleGenerateTitle} disabled={genBusy}>
                        {genBusy ? 'Đang tạo…' : 'GenerateTitle'}
                    </Button>
                    <Separator />
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                    >
                        {/* Title */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="header">Title</Label>
                            <Input
                                id="header"
                                value={form.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                            />
                            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                        </div>

                        {/* Slug */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={form.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                                onBlur={() =>
                                    setForm((f) => ({ ...f, slug: normalizeSlug(f.slug || f.title) }))
                                }
                            />
                            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
                        </div>
                        <div className="h-24 flex flex-col gap-3">
                            <Label htmlFor="slug">Tags</Label>
                            <TagInput value={tags} onChange={setTags} fetchTags={fetchTags} />
                        </div>
                        {/* Category + Status */}
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="flex flex-1 flex-col gap-3">
                                <Label>Category</Label>
                                <Select
                                    value={String(form.category_id)}
                                    onValueChange={(v) => handleChange('category_id', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories && categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col gap-3">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
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
                                {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status}</p>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                className="min-w-[9ch] whitespace-nowrap h-9 inline-flex items-center justify-center"
                                onClick={() => handlePreview(contentEditor)}
                            >
                                Xem Trước
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="min-w-[9ch] whitespace-nowrap h-9 inline-flex items-center justify-center"
                                onClick={() => {
                                    setForm((f) => ({ ...f, status: 'draft' }));
                                    handleSubmit();
                                }}
                            >
                                Lưu nháp
                            </Button>

                            <Button
                                type="submit"
                                disabled={!form.title || !form.category_id || isSubmitting}
                                className="min-w-[120px] whitespace-nowrap h-9 inline-flex items-center justify-center"
                            >
                                {isSubmitting ? 'Đang lưu…' : mode === 'create' ? 'Tạo bài' : 'Cập nhật'}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}

async function generateImageOnClient(params: {
    inputSrc: string;
    title: string;
    opts?: any;
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