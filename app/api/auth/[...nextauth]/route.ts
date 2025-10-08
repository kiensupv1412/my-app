import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
                const res = await fetch("http://localhost:4000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: creds?.email,
                        password: creds?.password,
                    }),
                });

                // log xem backend trả gì
                console.log("[authorize] status:", res.status);
                const data = await res.json().catch(() => null);
                console.log("[authorize] data:", data);

                if (!res.ok || !data?.success) return null;

                // hợp nhất user + token từ backend
                const user = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    token: data.access_token,
                };
                return user;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.email = (user as any).email;
                token.name = (user as any).name;
                token.accessToken = (user as any).token; // ⚠️ map từ access_token
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id,
                email: token.email,
                name: token.name,
                accessToken: token.accessToken,
            };
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
