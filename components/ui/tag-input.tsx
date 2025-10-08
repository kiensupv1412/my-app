"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverAnchor, // 👈 thêm cái này
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type Tag = { id: number; name: string; slug: string; isNew?: boolean; };
type TagInputProps = {
    value: Tag[];
    onChange: (tags: Tag[]) => void;
    fetchTags: (q: string) => Promise<Tag[]>;
};

const sanitizeName = (s: string) => s.replace(/\s+/g, " ").trim();
const slugifyVi = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function TagInput({ value, onChange, fetchTags }: TagInputProps) {
    const [query, setQuery] = React.useState("");
    const [options, setOptions] = React.useState<Tag[]>([]);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [focused, setFocused] = React.useState(false); // 👈 track focus
    const inputRef = React.useRef<HTMLInputElement>(null);

    // debounce search
    React.useEffect(() => {
        const t = setTimeout(async () => {
            const q = query.trim();
            if (!q) {
                setOptions([]);
                setOpen(false);
                return;
            }
            setLoading(true);
            try {
                const res = await fetchTags(q);
                setOptions(res || []);
                setOpen(focused && (res || []).length > 0); // 👈 chỉ mở khi còn focus
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query, focused, fetchTags]);

    const handleSelect = (tag: Tag) => {
        if (!value.some((t) => t.slug === tag.slug)) onChange([...value, tag]);
        setQuery("");
        setOptions([]);
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleCreate = () => {
        const name = sanitizeName(query);
        if (!name) return;
        const baseSlug = slugifyVi(name);

        let slug = baseSlug, i = 2;
        const taken = new Set([...value.map(t => t.slug), ...options.map(t => t.slug)]);
        while (taken.has(slug)) slug = `${baseSlug}-${i++}`;

        onChange([...value, { id: Date.now(), name, slug, isNew: true }]);
        setQuery("");
        setOptions([]);
        setOpen(false);
        inputRef.current?.focus();
    };

    const handleRemove = (slug: string) => onChange(value.filter(t => t.slug !== slug));

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen} modal={false}>{/* 👈 modal=false */}
                {/* Anchor chính là input */}
                <PopoverAnchor asChild>
                    <Input
                        ref={inputRef}
                        placeholder="Nhập tag…"
                        value={query}
                        onFocus={() => setFocused(true)}
                        onBlur={() => {
                            // trễ 1 tick để click vào item không bị đóng sớm
                            setTimeout(() => setFocused(false), 100);
                            setOpen(false);
                        }}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const clean = sanitizeName(query);
                                if (!clean) return;
                                if (options.length > 0) handleSelect(options[0]);
                                else handleCreate();
                            }
                            if (e.key === "ArrowDown" && options.length > 0) setOpen(true);
                        }}
                    />
                </PopoverAnchor>

                <PopoverContent
                    align="start"
                    side="bottom"
                    className="p-0 w-[280px]"
                    onOpenAutoFocus={(e) => e.preventDefault()}   // 👈 đừng cướp focus
                    onCloseAutoFocus={(e) => e.preventDefault()}  // 👈 giữ focus ở input
                >
                    <Command>
                        <CommandList>
                            <CommandGroup heading={loading ? "Đang tìm…" : "Chọn tag"}>
                                {!loading && options.length === 0 && (
                                    <CommandItem disabled>Không có kết quả</CommandItem>
                                )}
                                {options.map((t) => (
                                    <CommandItem
                                        key={t.id}
                                        onSelect={() => handleSelect(t)}
                                        className="cursor-pointer"
                                    >
                                        {t.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* selected tags */}
            <div className="flex flex-wrap gap-2">
                {value.map((t) => (
                    <Badge key={t.slug} variant="secondary" className="flex items-center gap-1">
                        {t.name}
                        <button
                            type="button"
                            aria-label={`Remove ${t.name}`}
                            onMouseDown={(e) => e.preventDefault()} // giữ focus input
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(t.slug);
                            }}
                            className="inline-flex"
                        >
                            <X size={14} />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    );
}
