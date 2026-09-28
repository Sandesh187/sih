import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import TopNavbar from '@/components/TopNavbar';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIH26182 SAHYOG VASP Attribution Engine',
  description: 'AI-powered Virtual Asset Service Provider identification and forensic blockchain tracing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Suspense fallback={<div className="h-24 w-full bg-slate-100 dark:bg-slate-900 animate-pulse border-b border-slate-200 dark:border-slate-800" />}>
              <TopNavbar />
            </Suspense>
            <main className="flex-1 w-full relative overflow-hidden flex flex-col">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
