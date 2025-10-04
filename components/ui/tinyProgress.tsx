// components/TinyProgress.tsx
import * as React from "react";

export function TinyProgress({
    value = 0,
    size = 44,
    stroke = 4,
    className = '',
}: { value?: number; size?: number; stroke?: number; className?: string }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, value));
    const offset = c * (1 - clamped / 100);

    return (
        <svg width={size} height={size} className={className}>
            {/* track */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth={stroke}
                className="text-slate-300"
                stroke="currentColor"
                fill="none"
            />
            {/* progress */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth={stroke}
                className="text-blue-600 transition-[stroke-dashoffset] duration-150"
                stroke="currentColor"
                fill="none"
                strokeDasharray={c}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
    );
}