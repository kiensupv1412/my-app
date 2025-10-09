"use client";

import * as React from "react";
import useSWR from "swr";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner"; // hoặc hook toast mày có sẵn

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const API = {
    tags: (q = "") => `/api/_s/admin/tags${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    categories: (q = "") => `/api/_s/admin/categories${q ? `?q=${encodeURIComponent(q)}` : ""}`,
};

export default function TaxonomyPanel() {
    const [qTag, setQTag] = React.useState("");
    const [qCat, setQCat] = React.useState("");

    const { data: tagResp, mutate: mutateTags } = useSWR(API.tags(qTag), fetcher);
    const { data: catResp, mutate: mutateCats } = useSWR(API.categories(qCat), fetcher);

    // form Tag
    const [tagName, setTagName] = React.useState("");
    const [tagDesc, setTagDesc] = React.useState("");

    // form Category
    const [catName, setCatName] = React.useState("");
    const [catDesc, setCatDesc] = React.useState("");
    const [parentId, setParentId] = React.useState<number | "">("");

    const onCreateTag = async () => {
        if (!tagName.trim()) return toast.error("Tên tag bắt buộc");
        const res = await fetch("/api/_s/admin/tags", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: tagName.trim(), description: tagDesc || null }),
        }).then((r) => r.json());

        if (!res?.success) return toast.error(res?.message || "Tạo tag lỗi");
        toast.success("Đã tạo tag");
        setTagName(""); setTagDesc("");
        mutateTags();
    };

    const onCreateCategory = async () => {
        if (!catName.trim()) return toast.error("Tên category bắt buộc");
        const res = await fetch("/api/_s/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: catName.trim(),
                description: catDesc || null,
                parent_id: parentId === "" ? null : Number(parentId),
            }),
        }).then((r) => r.json());

        if (!res?.success) return toast.error(res?.message || "Tạo category lỗi");
        toast.success("Đã tạo category");
        setCatName(""); setCatDesc(""); setParentId("");
        mutateCats();
    };

    const tags: any[] = tagResp?.data ?? [];
    const cats: any[] = catResp?.data ?? [];

    return (
        <div className="mx-auto max-w-5xl p-4 space-y-6">
            <h1 className="text-2xl font-semibold">Taxonomy Panel</h1>

            <Tabs defaultValue="tags" className="w-full">
                <TabsList>
                    <TabsTrigger value="tags">Tags</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                </TabsList>

                {/* TAGS */}
                <TabsContent value="tags" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tạo Tag</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Tên tag</Label>
                                    <Input placeholder="Ví dụ: Tử vi" value={tagName} onChange={(e) => setTagName(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Mô tả (tuỳ chọn)</Label>
                                    <Input placeholder="Mô tả ngắn" value={tagDesc} onChange={(e) => setTagDesc(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={onCreateTag}>Tạo tag</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách Tags</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Input className="w-64" placeholder="Tìm theo tên/slug…" value={qTag} onChange={(e) => setQTag(e.target.value)} />
                                <Button variant="outline" onClick={() => { setQTag(""); }}>Clear</Button>
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                                {tags.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between rounded border px-3 py-2">
                                        <div>
                                            <div className="font-medium">{t.name}</div>
                                            <div className="text-xs text-muted-foreground">{t.slug}</div>
                                        </div>
                                        {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
                                    </div>
                                ))}
                                {tags.length === 0 && <div className="text-sm text-muted-foreground">Không có kết quả.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tạo Category</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Tên category</Label>
                                    <Input placeholder="Ví dụ: Tử Vi Đẩu Số" value={catName} onChange={(e) => setCatName(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Parent (tuỳ chọn)</Label>
                                    <select
                                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                        value={parentId}
                                        onChange={(e) => setParentId(e.target.value === "" ? "" : Number(e.target.value))}
                                    >
                                        <option value="">— Root —</option>
                                        {cats.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} — {c.slug}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label>Mô tả (tuỳ chọn)</Label>
                                <Textarea placeholder="Mô tả ngắn" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={onCreateCategory}>Tạo category</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Input className="w-64" placeholder="Tìm theo tên/slug…" value={qCat} onChange={(e) => setQCat(e.target.value)} />
                                <Button variant="outline" onClick={() => { setQCat(""); }}>Clear</Button>
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                                {cats.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between rounded border px-3 py-2">
                                        <div>
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.slug}</div>
                                        </div>
                                        {c.parent_id && (
                                            <div className="text-xs text-muted-foreground">parent_id: {c.parent_id}</div>
                                        )}
                                    </div>
                                ))}
                                {cats.length === 0 && <div className="text-sm text-muted-foreground">Không có kết quả.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
