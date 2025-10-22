// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/categories', '/media', '/news'];

export async function middleware(req: NextRequest) {
    if (!PROTECTED.some(p => req.nextUrl.pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) return NextResponse.next();

    const loginUrl = new URL('/login', req.url);
    // callbackUrl = full path + search hiện tại
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
}

export const config = { matcher: PROTECTED.map(p => `${p}/:path*`) };
