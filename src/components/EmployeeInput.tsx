'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
import masterData from '@/data/masterData.json';

type Employee = {
  nama: string;
  nip: string;
  golongan: string;
  jabatan: string;
};

interface EmployeeInputProps {
  label: string;
  value: Employee;
  onChange: (value: Employee) => void;
}

const options = masterData.map((emp) => ({
  value: emp.nama,
  label: `${emp.nama} (${emp.jabatan})`,
  data: emp,
}));

export default function EmployeeInput({ label, value, onChange }: EmployeeInputProps) {
  const [selectedOption, setSelectedOption] = useState<any>(null);

  const handleSelectChange = (option: any) => {
    setSelectedOption(option);
    if (option) {
      onChange({
        nama: option.data.nama,
        nip: option.data.nip,
        golongan: option.data.golongan,
        jabatan: option.data.jabatan,
      });
    } else {
      onChange({ nama: '', nip: '', golongan: '', jabatan: '' });
    }
  };

  const handleTextChange = (field: keyof Employee, val: string) => {
    // If user edits manually, we might want to clear the dropdown selection if it no longer matches
    // But for now, we just update the text and keep the selectedOption as is
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{label}</h3>
      
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1">Pilih dari Master Data (Opsional)</label>
        <Select
          className="text-sm"
          options={options}
          isClearable
          placeholder="Cari pegawai..."
          value={selectedOption}
          onChange={handleSelectChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nama Lengkap</label>
          <input
            type="text"
            className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
            value={value.nama}
            onChange={(e) => handleTextChange('nama', e.target.value)}
            placeholder="Ketik nama manual..."
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">NIP</label>
          <input
            type="text"
            className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
            value={value.nip}
            onChange={(e) => handleTextChange('nip', e.target.value)}
            placeholder="Ketik NIP..."
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Golongan / Pangkat</label>
          <input
            type="text"
            className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
            value={value.golongan}
            onChange={(e) => handleTextChange('golongan', e.target.value)}
            placeholder="Contoh: Penata Tk. I (III/d)"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Jabatan</label>
          <input
            type="text"
            className="w-full rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
            value={value.jabatan}
            onChange={(e) => handleTextChange('jabatan', e.target.value)}
            placeholder="Ketik jabatan..."
            required
          />
        </div>
      </div>
    </div>
  );
}
