// app/api/auth/[...nextauth]/route.ts 
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const auth = NextAuth({
    session: { strategy: "jwt" },

    providers: [
        Credentials({
            name: "credentials",
            credentials: { email: {}, password: {} },
            async authorize(creds) {
                // gọi API backend đăng nhập
                const r = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/api/auth/login", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email: creds?.email, password: creds?.password }),
                });
                if (!r.ok) return null;
                const data = await r.json();

                // QUAN TRỌNG: trả về accessToken để NextAuth nhét vào token
                // tuỳ API của bạn: đổi key 'access_token'/'token' cho đúng
                return {
                    id: String(data.user.id),
                    name: data.user.name,
                    email: data.user.email,
                    accessToken: data.access_token ?? data.token, // phải có 1 trong 2
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            // khi đăng nhập lần đầu, copy accessToken từ user vào token
            if (user?.accessToken) {
                token.accessToken = user.accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            // đưa accessToken ra session (để client cần cũng lấy được)
            (session as any).accessToken = (token as any).accessToken;
            return session;
        },
    },

    // nếu bạn dùng NEXTAUTH_SECRET nhớ set trong .env
});

export { auth as GET, auth as POST };