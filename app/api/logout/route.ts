import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const cookie = (req.headers as any).get("cookie") ?? "";
    const r = await fetch(`${process.env.API_BASE}/auth/logout`, {
        method: "POST",
        headers: { cookie },
        credentials: "include",
    });
    return NextResponse.json(await r.json(), { status: r.status });
}
