// app/login/page.tsx
'use client';

import GoogleIcon from '@/components/ui/GoogleIcon';
import Gradient from '@/components/ui/Gradient';

export default function LoginPage() {
  const onLoginGoogle = () => {
    const ref = 'http://localhost:3000';
    const api = 'http://localhost:4000';
    window.location.href = `${api}/api/auth/google?ref=${encodeURIComponent(ref)}`;
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-14 bg-white dark:bg-gray-950">
      <Gradient />
      <a
        href="/"
        className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-white/5 backdrop-blur hover:bg-white dark:hover:bg-white/10"
      >
        {/* Home icon (heroicons home) */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5m4 0h5a1 1 0 001-1V10" />
        </svg>
        Home
      </a>

      <main className="relative px-5 py-10 flex xl:flex-row flex-col gap-10">
        {/* Card 1: Google Account */}
        <section className="max-w-sm w-full rounded-lg ring-1 ring-gray-200 dark:ring-gray-800 shadow bg-white/75 dark:bg-white/5 backdrop-blur divide-y divide-gray-200 dark:divide-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <p className="text-2xl text-gray-900 dark:text-white font-bold flex items-center gap-2">
              Google Account
              <span className="inline-flex items-center font-medium rounded-md text-xs px-2 py-1 bg-blue-50 dark:bg-blue-400/10 text-blue-500 dark:text-blue-400 ring-1 ring-inset ring-blue-500/25 dark:ring-blue-400/25">
                Easy
              </span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-3">
              Get up and running in less than a minute using Google.
            </p>

            <button
              onClick={onLoginGoogle}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-gray-900 dark:text-white ring-1 ring-gray-200 dark:ring-gray-800 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>

            <div className="mt-5 rounded-md border border-gray-200 dark:border-gray-800 p-4">
              <p className="font-medium">Required Scopes</p>
              <div className="space-y-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div>userinfo.email — You may be emailed in the future.</div>
                <div>
                  <a href="/" className="underline">Google Search Console API</a> (read only) — Used to query pages that are indexed.
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-blue-500 -mb-[3px] mr-1 inline-block">🛡️</span>
              You can delete your data and revoke tokens at any time.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
