import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocGene | Modern Document Generator',
  description: 'Generate DOP, Surat Tugas, and Kwitansi easily.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
