// app/api/_s/[...path]/route.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SERVER = process.env.SERVER_URL ?? "http://localhost:4000";

function buildUrl(pathname: string, search: string) {
    const clean = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    return `${SERVER}/${clean}${search || ""}`;
}

async function forward(method: string, req: Request, params: { path: string[] }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const url = new URL(req.url);
    const upstream = buildUrl(params.path.join("/"), url.search);

    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => (headers[k] = v));
    if (token?.accessToken) headers["Authorization"] = `Bearer ${token.accessToken}`;

    const res = await fetch(upstream, { method, headers, cache: "no-store" });
    const text = await res.text();
    try {
        return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
        return new NextResponse(text, { status: res.status });
    }
}

export async function GET(req: Request, ctx: any) { return forward("GET", req, ctx.params); }
export async function POST(req: Request, ctx: any) { return forward("POST", req, ctx.params); }
export async function PUT(req: Request, ctx: any) { return forward("PUT", req, ctx.params); }
export async function PATCH(req: Request, ctx: any) { return forward("PATCH", req, ctx.params); }
export async function DELETE(req: Request, ctx: any) { return forward("DELETE", req, ctx.params); }
