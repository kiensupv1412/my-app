'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm({ callbackUrl = '/dashboard' }: { callbackUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const res = await signIn('credentials', { redirect: false, email, password, callbackUrl });
      if (!res) return setErr('Không nhận được phản hồi.');
      if (res.error) return setErr(res.error === 'CredentialsSignin' ? 'Sai email/mật khẩu' : res.error);
      router.push(res.url || callbackUrl);
    } catch (e: any) { setErr(e?.message || 'Đăng nhập thất bại'); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border p-2" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <input className="w-full border p-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" required />
      <button disabled={busy} className="w-full bg-black text-white p-2 rounded disabled:opacity-60">
        {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
      {err && <p className="text-red-500 text-sm text-center">{err}</p>}
    </form>
  );
}