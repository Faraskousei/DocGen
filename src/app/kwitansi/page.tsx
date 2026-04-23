'use client';

import { useState } from 'react';
import EmployeeInput from '@/components/EmployeeInput';
import { toast } from 'sonner';

export default function KwitansiPage() {
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [dalamRangka, setDalamRangka] = useState('');
  const [pegawai, setPegawai] = useState({ nama: '', nip: '', golongan: '', jabatan: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tujuan || !tanggal || !dalamRangka || !pegawai.nama.trim()) {
      toast.error('Semua field harus diisi!');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Generating Kwitansi...');

    try {
      const response = await fetch('/api/generate/kwitansi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tujuan, 
          tanggal, 
          dalam_rangka: dalamRangka,
          pegawai 
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal men-generate dokumen.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kwitansi_${pegawai.nama.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Kwitansi berhasil di-generate!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Generate Kwitansi</h1>
        <p className="text-slate-500 mt-2">Buat Kwitansi Perjalanan Dinas (Nominal fix Rp. 170.000)</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
            <input
              type="text"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              placeholder="Contoh: 1 April 2026"
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tujuan</label>
            <input
              type="text"
              required
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="Contoh: Jakarta"
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Dalam Rangka</label>
            <textarea
              required
              value={dalamRangka}
              onChange={(e) => setDalamRangka(e.target.value)}
              placeholder="Contoh: Pembayaran biaya perjalanan dinas..."
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border h-20"
            />
          </div>
        </div>

        <div className="space-y-6">
          <EmployeeInput
            label="Detail Pegawai Penerima"
            value={pegawai}
            onChange={setPegawai}
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
             {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              </>
            ) : 'Generate Kwitansi'}
          </button>
        </div>
      </form>
    </div>
  );
}
