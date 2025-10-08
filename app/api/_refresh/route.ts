/*
 * path: app/api/_refresh/route.ts
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const cookie = (req.headers as any).get("cookie") ?? "";
    const r = await fetch(`${process.env.API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { cookie },
        credentials: "include",
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
}
