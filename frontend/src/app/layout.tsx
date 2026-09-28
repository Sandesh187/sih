import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIH26182 VASP Attribution Engine',
  description: 'AI-powered Virtual Asset Service Provider identification and tracing',
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
          <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] text-[var(--text-main)] p-4 md:p-8 transition-colors">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
