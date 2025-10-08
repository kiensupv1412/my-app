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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <SWRConfig value={swrConfig}>
          <SidebarProvider>
            <AppSidebarLeft variant="inset" />
            <MainInset>
              <AppHeader />
              {children}
              <Toaster richColors position="top-right" />
            </MainInset>
          </SidebarProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
