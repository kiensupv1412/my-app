import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: { signIn: "/login" },
    callbacks: { authorized: () => true },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/news/:path*",
        "/media/:path*",
        "/categories/:path*",
    ],
};
