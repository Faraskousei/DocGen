'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, FileSignature, Receipt, Upload, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'DOP Daftar Ongkos Perjalanan', href: '/dop', icon: FileText },
  { name: 'Surat Tugas', href: '/surat-tugas', icon: FileSignature },
  { name: 'Kwitansi', href: '/kwitansi', icon: Receipt },
  { name: 'Import Rekap', href: '/import-rekap', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-slate-200 shadow-sm">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          DocuGen
        </h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  'group flex items-center gap-x-3 rounded-xl p-3 text-sm font-medium transition-all duration-200'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                    'h-5 w-5 shrink-0 transition-colors duration-200'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
