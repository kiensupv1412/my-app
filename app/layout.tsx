/*
 * path: app/layout.tsx
 */

'use client';

import { AppHeader } from '@/components/layouts/header';
import { AppSidebarLeft } from '@/components/layouts/sidebar-left';
import { AppToastProvider } from '@/components/providers/app-toast';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SWRConfig } from 'swr';
import { MainInset } from '@/components/ui/main';
import { Toaster } from "sonner";
import { fetcher } from '@/lib/fetcher';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
          <AppToastProvider>
            <SidebarProvider>
              <AppSidebarLeft variant="inset" />
              <MainInset>
                <AppHeader />
                {children}
                <Toaster richColors position="top-right" />
              </MainInset>
            </SidebarProvider>
          </AppToastProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
