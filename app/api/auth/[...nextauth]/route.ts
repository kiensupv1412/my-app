// app/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const SERVER =
    process.env.SERVER_URL ??
    process.env.NEXT_PUBLIC_SERVER_URL ??
    "http://localhost:4000"; // fallback an toàn

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(creds) {
                try {
                    if (!creds?.email || !creds?.password) return null;
                    // DEBUG nhẹ (chỉ in khi DEV)
                    if (process.env.NODE_ENV !== "production") {
                        console.log("[authorize] SERVER =", SERVER);
                    }

                    const res = await fetch(`${SERVER}/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: creds.email, password: creds.password }),
                    });

                    if (!res.ok) {
                        // xem lý do 401 từ server
                        const text = await res.text().catch(() => "");
                        console.error("[authorize] login fail", res.status, text);
                        return null;
                    }

                    const user = await res.json(); // { id, email, name?, role? }
                    return user || null;
                } catch (e) {
                    console.error("[authorize] err", e);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.email = (user as any).email;
                token.name = (user as any).name;
                token.role = (user as any).role ?? "user";
            }
            return token;
        },
        async session({ session, token }) {
            (session.user as any).id = token.id;
            (session.user as any).role = token.role;
            return session;
        },
    },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
