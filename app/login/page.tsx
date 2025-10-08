'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        await signIn('credentials', { email, password, redirect: true, callbackUrl: '/dashboard' });
        setBusy(false);
    }

    return (
        <form onSubmit={onSubmit} className="max-w-sm mx-auto py-12 space-y-4">
            <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button disabled={busy} type="submit" className="w-full">Đăng nhập</Button>
        </form>
    );
}
