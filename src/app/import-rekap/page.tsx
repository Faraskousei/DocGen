'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import mammoth from 'mammoth';
import masterData from '@/data/masterData.json';

type Employee = {
  nama: string;
  alias: string[];
  nip: string;
  golongan: string;
  jabatan: string;
};

type ParsedRecord = {
  tujuan: string;
  tanggal: string;
  rawNames: string;
  nomorSppd: string;
  anggota: any[];
  errors: string[];
};

function mapAlias(nameInput: string) {
  const cleanName = nameInput.trim().toUpperCase();
  const employee = (masterData as Employee[]).find(emp => 
    emp.alias.map(a => a.toUpperCase()).includes(cleanName) || 
    emp.nama.toUpperCase() === cleanName
  );
  return employee;
}

export default function ImportRekapPage() {
  const [inputText, setInputText] = useState('');
  const [nomorSppd, setNomorSppd] = useState('');
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast.error('Harap upload file dengan format .docx');
      return;
    }

    const toastId = toast.loading('Mengekstrak tabel dari dokumen...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (result.value) {
        // Parse HTML to extract table rows
        const parser = new DOMParser();
        const doc = parser.parseFromString(result.value, 'text/html');
        const rows = doc.querySelectorAll('tr');
        
        let extractedText = '';
        let isFirstRow = true;

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            // Assume format: NO, KECAMATAN, NAMA, TANGGAL, KETERANGAN
            const toTitleCase = (str: string) => {
              return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            };
            const kecamatanRaw = cells[1].textContent?.trim() || '';
            const kecamatan = toTitleCase(kecamatanRaw);
            const nama = cells[2].textContent?.trim() || '';
            const tanggal = cells[3].textContent?.trim() || '';
            const nomor = cells[4] ? cells[4].textContent?.trim() || '' : '';

            // Skip header row
            if (isFirstRow && (kecamatan.toUpperCase().includes('KECAMATAN') || nama.toUpperCase().includes('NAMA'))) {
              isFirstRow = false;
              return;
            }
            isFirstRow = false;

            if (kecamatan && nama && tanggal) {
              extractedText += `${kecamatan}\n${nama}\n${tanggal}\n${nomor}\n\n`;
            }
          }
        });

        if (extractedText) {
          setInputText(extractedText.trim());
          toast.success('Berhasil mengekstrak tabel REKAP!', { id: toastId });
        } else {
          // Fallback to raw text if no table found
          const rawResult = await mammoth.extractRawText({ arrayBuffer });
          if (rawResult.value) {
            setInputText(rawResult.value);
            toast.success('Mengekstrak teks mentah (Tabel tidak ditemukan).', { id: toastId });
          } else {
            toast.error('Dokumen kosong atau tidak bisa dibaca.', { id: toastId });
          }
        }
      } else {
        toast.error('Dokumen kosong atau tidak bisa dibaca.', { id: toastId });
      }
    } catch (error: any) {
      toast.error('Gagal membaca file: ' + error.message, { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParse = () => {
    setIsParsing(true);
    try {
      const lines = inputText.split('\n').map(l => l.trim()).filter(l => l !== '');
      const parsed: ParsedRecord[] = [];

      for (let i = 0; i < lines.length; i += 4) {
        if (i + 2 >= lines.length) {
          toast.error(`Format tidak lengkap pada baris ke-${i + 1}. Pastikan setiap entri memiliki minimal: Tujuan, Nama, Tanggal.`);
          break;
        }

        const tujuan = lines[i];
        const rawNames = lines[i + 1];
        const tanggal = lines[i + 2];
        const nomorKwitansi = lines[i + 3] || '';
        const errors: string[] = [];
        const anggota: any[] = [];

        const names = rawNames.split(',').map(n => n.trim()).filter(n => n !== '');
        
        const uniqueNames = Array.from(new Set(names.map(n => n.toUpperCase())));
        if (uniqueNames.length !== names.length) {
          errors.push('Terdapat duplikasi nama.');
        }

        names.forEach(name => {
          const emp = mapAlias(name);
          if (emp) {
            anggota.push({
              nama: emp.nama,
              nip: emp.nip,
              golongan: emp.golongan,
              jabatan: emp.jabatan,
            });
          } else {
            errors.push(`Alias "${name}" tidak ditemukan.`);
          }
        });

        if (anggota.length < 3) {
          errors.push('Minimal 3 pegawai untuk DOP Daftar Ongkos Perjalanan.');
        }

        parsed.push({ tujuan, tanggal, rawNames, nomorSppd: nomorKwitansi, anggota, errors });
      }

      setRecords(parsed);
      if (parsed.length > 0) {
        toast.success(`Berhasil mem-parsing ${parsed.length} data.`);
      }
    } catch (e: any) {
      toast.error('Gagal mem-parsing teks: ' + e.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (records.length === 0) {
      toast.error('Tidak ada data untuk di-generate.');
      return;
    }

    const hasErrors = records.some(r => r.errors.length > 0);
    if (hasErrors) {
      toast.error('Terdapat error pada data. Harap perbaiki sebelum generate.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Generating bulk documents (ZIP)...');

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          records,
          nomorSppd
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal men-generate dokumen zip.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bulk_Documents.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Bulk Documents ZIP berhasil di-download!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Import Rekap</h1>
        <p className="text-slate-500 mt-2">Generate DOP dan Kwitansi sekaligus (Bulk).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Input Data</h2>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Paste Teks Rekap</label>
                <div>
                  <input 
                    type="file" 
                    accept=".docx" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                  >
                    <UploadIcon className="w-3.5 h-3.5" />
                    Upload REKAP.docx
                  </button>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={"CARINGIN\nHERI,ALVI,RAKA\n1 APRIL 2026\n\nCIBINONG\nIIN,ALVI,HERI\n2 APRIL 2026"}
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 border font-mono text-sm h-64"
              />
            </div>
            <button
              onClick={handleParse}
              disabled={isParsing || !inputText.trim()}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              Parse Data
            </button>
          </div>

          {records.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Pengaturan DOP Daftar Ongkos Perjalanan</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nomor DOP / SPPD</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-mono">500.9.1/</span>
                    <input
                      type="text"
                      value={nomorSppd}
                      onChange={(e) => setNomorSppd(e.target.value)}
                      placeholder="765"
                      className="w-24 rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border text-sm font-mono"
                    />
                    <span className="text-sm text-slate-500 font-mono"> - Perindustrian</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic">* Nomor ini akan dimasukkan ke dalam dokumen DOP Daftar Ongkos Perjalanan.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Preview Data ({records.length})</h2>
              <button
                onClick={handleGenerate}
                disabled={isLoading || records.length === 0 || records.some(r => r.errors.length > 0)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-5 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? 'Generating...' : 'Bulk Generate ZIP'}
              </button>
            </div>
            
            {records.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <UploadIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>Belum ada data. Paste teks dan klik Parse Data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Tujuan</th>
                      <th className="px-6 py-3 font-medium">Tanggal</th>
                      <th className="px-6 py-3 font-medium">No. DOP/SPPD</th>
                      <th className="px-6 py-3 font-medium">Mapping Pegawai</th>
                      <th className="px-6 py-3 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-800">{r.tujuan}</td>
                        <td className="px-6 py-4 text-slate-600">{r.tanggal}</td>
                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{r.nomorSppd || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-500 mb-1">Input: {r.rawNames}</div>
                          <div className="flex flex-wrap gap-1">
                            {r.anggota.map((a, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {a.nama}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {r.errors.length > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 mb-1">
                                Error
                              </span>
                              {r.errors.map((e, idx) => (
                                <span key={idx} className="text-[10px] text-red-500 block leading-tight">{e}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}
