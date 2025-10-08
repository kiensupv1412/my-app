/*
 * path: app/layout.tsx
 */

'use client';

import { AppHeader } from '@/components/layouts/header';
import { AppSidebarLeft } from '@/components/layouts/sidebar-left';
import { SidebarProvider } from "@/components/ui/sidebar";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Toaster } from "sonner";
import { MainInset } from '@/components/ui/main';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr';
import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = ['/login', '/register', '/forgot-password'].some(p => pathname.startsWith(p));

  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <SessionProvider>
          <SWRConfig value={swrConfig}>
            <SidebarProvider>
              {!isAuth && <AppSidebarLeft variant="inset" />}
              <MainInset>
                {!isAuth && <AppHeader />}
                {children}
                <Toaster richColors position="top-right" />
              </MainInset>
            </SidebarProvider>
          </SWRConfig>
        </SessionProvider>
      </body>
    </html>
  );
}
