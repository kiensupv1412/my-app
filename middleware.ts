/*
 * path: middleware.ts
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default withAuth(
    async (req) => {
        const { pathname } = req.nextUrl;

        // Check JWT
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            const url = new URL("/login", req.url);
            url.searchParams.set("callbackUrl", req.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        // RBAC đơn giản
        if (pathname.startsWith("/admin") && (token as any).role !== "admin") {
            return NextResponse.redirect(new URL("/403", req.url));
        }

        return NextResponse.next();
    },
    {
        pages: { signIn: "/login" },     // để withAuth biết trang đăng nhập
        callbacks: { authorized: () => true }, // cho phép tự xử lý redirect ở trên
    }
);

// Chỉ match các route cần bảo vệ; tránh chặn static & auth
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/media/:path*",
        "/news/:path*",
        "/categories/:path*",
    ],
};
