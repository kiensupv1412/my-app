"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    if (res?.error) setErr("Sai email hoặc mật khẩu");
    else router.push(callbackUrl);
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-bold text-center">Đăng nhập</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full border p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="w-full bg-black text-white p-2 rounded">Đăng nhập</button>
        {err && <p className="text-red-500 text-sm text-center">{err}</p>}
      </form>
    </div>
  );
}
