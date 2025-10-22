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
    <div className="px-5 py-10 flex flex-col items-center gap-10">
      <GoogleAccountCard />
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


import Link from "next/link";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-0.5 0 48 48" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" {...props}>
      <g fill="none" fillRule="evenodd">
        <path d="M9.827 24c0-1.524.253-2.986.705-4.356l-7.909-6.04A23.456 23.456 0 0 0 .213 24c0 3.737.868 7.26 2.407 10.388l7.905-6.05A13.885 13.885 0 0 1 9.827 24" fill="#FBBC05" />
        <path d="M23.714 10.133c3.311 0 6.302 1.174 8.652 3.094L39.202 6.4C35.036 2.773 29.695.533 23.714.533a23.43 23.43 0 0 0-21.09 13.071l7.908 6.04a13.849 13.849 0 0 1 13.182-9.51" fill="#EB4335" />
        <path d="M23.714 37.867a13.849 13.849 0 0 1-13.182-9.51l-7.909 6.038a23.43 23.43 0 0 0 21.09 13.072c5.732 0 11.205-2.036 15.312-5.849l-7.507-5.804c-2.118 1.335-4.786 2.053-7.804 2.053" fill="#34A853" />
        <path d="M46.145 24c0-1.387-.213-2.88-.534-4.267H23.714V28.8h12.604c-.63 3.091-2.346 5.468-4.8 7.014l7.507 5.804c4.314-4.004 7.12-9.969 7.12-17.618" fill="#4285F4" />
      </g>
    </svg>
  );
}

function GoogleAccountCard() {
  return (
    <div className="w-full max-w-sm rounded-lg ring-1 ring-gray-200 dark:ring-gray-800 shadow divide-y divide-gray-200 dark:divide-gray-800 bg-white/75 dark:bg-white/5 backdrop-blur">
      {/* Header + CTA */}
      <div className="px-4 py-5 sm:p-6">
        <p className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          Google Account
          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-500 ring-1 ring-inset ring-blue-500 ring-opacity-25 dark:bg-blue-400 dark:bg-opacity-10 dark:text-blue-400 dark:ring-blue-400 dark:ring-opacity-25">
            Easy
          </span>
        </p>
        <p className="mt-1 mb-3 text-gray-500 dark:text-gray-400">
          Get up and running in less than a minute using Google.
        </p>

        <Link
          href="/auth/google"
          className="flex items-center justify-center gap-x-2.5 rounded-md px-3.5 py-2.5 text-sm font-medium
                     text-gray-700 dark:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/50
                     ring-1 ring-inset ring-gray-300 dark:ring-gray-700 shadow-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400"
          aria-label="Sign in with Google"
        >
          <GoogleIcon />
          <span>Sign in with Google</span>
        </Link>

        {/* Required Scopes card */}
        <div className="mt-5 w-full rounded-lg bg-white p-4 text-gray-900 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-800 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Required Scopes</p>
              <div className="mt-1 space-y-2 text-sm leading-4 opacity-90">
                <div>userinfo.email — You may be emailed in the future.</div>
                <div>
                  <Link href="/" className="underline">
                    Google Search Console API
                  </Link>{" "}
                  (read only) — Used to query pages that are indexed.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="mt-5">
          <span className="i-heroicons-shield-check -mb-[3px] mr-1 text-blue-500" />
          <span>You can delete your data and revoke tokens at any time.</span>
        </p>
      </div>
    </div>
  );
}

