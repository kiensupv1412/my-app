'use client';

import React, { useMemo, useState } from 'react';


type GenOptions = {
    width?: number;
    height?: number;
    padding?: number;
    fontSize?: number;
    lineHeight?: number;
    textColor?: string;
    fontFamily?: string;
};

export default function OgMaker() {
    const [title, setTitle] = useState('Lá số Tứ Trụ – Xem Bát Tự chuẩn xác cho người mới, Xem Bát Tự chuẩn xác cho người mới, Xem Bát Tự chuẩn xác cho người mới');
    const [imageUrl, setImageUrl] = useState('thumb-1920x1080.png');
    const [file, setFile] = useState<File | null>(null);
    const [outUrl, setOutUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
    const inputSrc = imageUrl.trim() ? imageUrl.trim() : objectUrl;

    async function onGenerate() {
        if (!inputSrc) return alert('Chọn ảnh hoặc nhập URL ảnh trước đã.');
        setBusy(true);
        setOutUrl(null);
        try {
            const blob = await generateImageOnClient({
                inputSrc,
                title,
            });
            const url = URL.createObjectURL(blob);
            setOutUrl(url);
        } catch (e: any) {
            alert(e?.message || 'Generate failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ maxWidth: 720, margin: '24px auto', padding: 16, fontFamily: 'system-ui, Arial' }}>
            <h2 style={{ marginBottom: 12 }}>OG Maker – Frontend only (Canvas)</h2>

            <label style={{ display: 'block', fontWeight: 600, marginTop: 8 }}>Title</label>
            <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
            />

            <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontWeight: 600 }}>Ảnh đầu vào</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    style={{ display: 'block', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>hoặc URL:</span>
                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
                    />
                </div>
                <small style={{ color: '#666' }}>
                    * URL ngoài domain cần CORS (`Access-Control-Allow-Origin:*`) và `crossOrigin='anonymous'`.
                </small>
            </div>

            <button
                onClick={onGenerate}
                disabled={busy}
                style={{
                    marginTop: 16,
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #333',
                    background: busy ? '#ddd' : '#111',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                }}
            >
                {busy ? 'Generating…' : 'Generate Image'}
            </button>

            {outUrl && (
                <>
                    <h3 style={{ marginTop: 20 }}>Preview</h3>
                    <img
                        src={outUrl}
                        alt="Preview"
                        style={{ width: '100%', maxWidth: 600, display: 'block' }}
                    />
                    <div style={{ marginTop: 10 }}>
                        <a
                            href={outUrl}
                            download={`og-${Date.now()}.png`}
                            style={{ padding: '10px 14px', border: '1px solid #333', borderRadius: 8, textDecoration: 'none' }}
                        >
                            Download PNG
                        </a>
                    </div>
                </>
            )}
        </div>
    );
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