// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED = ['/dashboard', '/categories', '/media', '/news'];

// tên cookie & secret phải TRÙNG với server Express
const COOKIE = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'sid';
const SECRET = process.env.SESSION_SECRET || 'change_me';

// helper: verify JWT cookie bằng jose (Edge-compatible)
async function verifySessionCookie(req: NextRequest) {
    const raw = req.cookies.get(COOKIE)?.value;
    if (!raw) return null;
    try {
        const { payload } = await jwtVerify(
            raw,
            new TextEncoder().encode(SECRET) // secret chuỗi
        );
        // payload.sub, payload.user..., tuỳ bạn đã ký gì
        return payload as { sub?: string; user?: any } | null;
    } catch {
        return null;
    }
}

export async function middleware(req: NextRequest) {
    // bỏ qua route không bảo vệ
    if (!PROTECTED.some(p => req.nextUrl.pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // verify cookie sid
    const sess = await verifySessionCookie(req);
    if (sess?.sub) {
        return NextResponse.next(); // ok, đã đăng nhập
    }

    // chưa đăng nhập → chuyển về /login + callbackUrl
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
}

// chỉ match vào các path cần bảo vệ
export const config = {
    matcher: PROTECTED.map(p => `${p}/:path*`),
};