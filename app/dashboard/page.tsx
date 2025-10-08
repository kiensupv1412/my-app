// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login"); // Không có session => về login

    return (
        <div>
            <h1>Xin chào {session.user?.name}</h1>
            <p>Email: {session.user?.email}</p>
        </div>
    );
}
