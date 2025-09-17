/*
 * path: app/layout.tsx
 */

'use client';

import { AppHeader } from '@/components/layouts/header';
import { AppSidebar } from '@/components/layouts/sidebar';
import { AppToastProvider } from '@/components/providers/app-toast';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SWRConfig } from 'swr';
import ModalRoot from '@/components/modals/ModalRoot';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});




export default function RootLayout({ children }: { children: React.ReactNode }) {

  const fetcher = async (url: string) => {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
          <AppToastProvider>
            <SidebarProvider>
              <AppSidebar variant="inset" />
              <SidebarInset>
                <AppHeader />
                {children}
                <ModalRoot />
              </SidebarInset>
            </SidebarProvider>
          </AppToastProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
