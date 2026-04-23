'use client';

import { useState } from 'react';
import EmployeeInput from '@/components/EmployeeInput';
import { toast } from 'sonner';

export default function SuratTugasPage() {
  const [nomorSurat, setNomorSurat] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [dalamRangka, setDalamRangka] = useState('');
  const [subKegiatan, setSubKegiatan] = useState('Koordinasi, Sinkronisasi dan Pelaksanaan Pembangunan Sarana dan Prasarana Industri');
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState('');
  const [anggota, setAnggota] = useState([
    { nama: '', nip: '', golongan: '', jabatan: '' },
    { nama: '', nip: '', golongan: '', jabatan: '' },
    { nama: '', nip: '', golongan: '', jabatan: '' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnggotaChange = (index: number, value: any) => {
    const newAnggota = [...anggota];
    newAnggota[index] = value;
    setAnggota(newAnggota);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tujuan || !tanggal || !nomorSurat || !dalamRangka) {
      toast.error('Semua field utama harus diisi!');
      return;
    }
    const filledAnggota = anggota.filter(a => a.nama.trim() !== '');
    if (filledAnggota.length < 3) {
      toast.error('Minimal 3 orang pegawai harus diisi!');
      return;
    }
    const names = filledAnggota.map(a => a.nama.trim().toUpperCase());
    if (new Set(names).size !== names.length) {
      toast.error('Terdapat duplikasi nama pegawai!');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Generating Surat Tugas...');

    try {
      const response = await fetch('/api/generate/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nomor_surat: nomorSurat, 
          tujuan, 
          tanggal, 
          dalam_rangka: dalamRangka,
          sub_kegiatan: subKegiatan,
          waktu_pelaksanaan: waktuPelaksanaan,
          anggota: filledAnggota 
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal men-generate dokumen.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Surat_Tugas.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Surat Tugas berhasil di-generate!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Generate Surat Tugas</h1>
        <p className="text-slate-500 mt-2">Buat Surat Tugas resmi untuk perjalanan dinas</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nomor Surat</label>
            <input
              type="text"
              required
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              placeholder="Contoh: 094/123/ST/2026"
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
            />
          </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Sub Kegiatan</label>
            <input
              type="text"
              required
              value={subKegiatan}
              onChange={(e) => setSubKegiatan(e.target.value)}
              placeholder="Contoh: Koordinasi, Sinkronisasi..."
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Dalam Rangka</label>
            <textarea
              required
              value={dalamRangka}
              onChange={(e) => setDalamRangka(e.target.value)}
              placeholder="Contoh: Menghadiri rapat koordinasi..."
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border h-11"
              rows={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Waktu Pelaksanaan</label>
            <input
              type="text"
              required
              value={waktuPelaksanaan}
              onChange={(e) => setWaktuPelaksanaan(e.target.value)}
              placeholder="Contoh: 1 (satu) hari kerja pada Hari Kamis, Tanggal 02 April 2026"
              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Daftar Pegawai</h2>
          {anggota.map((emp, idx) => (
            <EmployeeInput
              key={idx}
              label={`Pegawai ${idx + 1}`}
              value={emp}
              onChange={(val) => handleAnggotaChange(idx, val)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
             {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memproses...
              </>
            ) : 'Generate Surat Tugas'}
          </button>
        </div>
      </form>
    </div>
  );
}
