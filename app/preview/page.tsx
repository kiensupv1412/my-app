'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';

type PreviewData = {
    title: string;
    slug: string;
    html: string;
    descHtml?: string | null;
    thumbUrl?: string | null;
    meta: { category_id: number; status: string; tags: string[]; at: number };
};

export default function PreviewPage() {
    const sp = useSearchParams();
    const k = sp.get('k') || '';
    const [data, setData] = useState<PreviewData | null>(null);

    useEffect(() => {
        if (!k) return;
        try {
            const raw = sessionStorage.getItem(k);
            if (raw) setData(JSON.parse(raw));
        } catch {
        }
    }, [k]);

    useEffect(() => {
        if (!k) return;
        try {
            const raw = localStorage.getItem(k);
            if (raw) {
                setData(JSON.parse(raw));
                localStorage.removeItem(k);
            }
        } catch { }
    }, [k]);

    const safeHtml = useMemo(
        () => DOMPurify.sanitize(data?.html ?? ''),
        [data?.html]
    );


    const descHtml = useMemo(
        () => DOMPurify.sanitize(data?.descHtml ?? ''),
        [data?.descHtml]
    );

    return (
        <main className="mx-auto max-w-3xl p-6 overflow-y-auto">
            {!data ? (
                <div className="text-sm text-muted-foreground">
                    Chưa có dữ liệu preview. Hãy bấm <b>Xem Trước</b> từ trang biên tập.
                </div>
            ) : (
                <>
                    <header className="mb-6">
                        <p className="text-xs text-muted-foreground">
                            slug: <code>{data.slug}</code> — trạng thái: <code>{data.meta.status}</code>
                        </p>
                        <br />
                        <h1 className="text-2xl font-bold">{data.title || '(Không tiêu đề)'}</h1>
                        <div dangerouslySetInnerHTML={{ __html: descHtml }} />
                    </header>

                    {data.thumbUrl && (
                        <div className="mb-6">
                            {/* chỉ hiển thị minh họa; production nên có Image component/cdn */}
                            <img src={data.thumbUrl} alt="" className="w-full h-auto rounded-md" />
                        </div>
                    )}

                    <article className="prose prose-zinc max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
                    </article>
                </>
            )}
        </main>
    );
}
