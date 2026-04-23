import masterData from '../data/masterData.json';

export interface Employee {
  nama: string;
  alias: string[];
  nip: string;
  golongan: string;
  jabatan: string;
}

export function mapAliasToEmployee(nameInput: string): Employee {
  const cleanName = nameInput.trim().toUpperCase();
  const employee = (masterData as Employee[]).find(emp => 
    emp.alias.map(a => a.toUpperCase()).includes(cleanName) || 
    emp.nama.toUpperCase() === cleanName
  );

  if (!employee) {
    throw new Error(`Pegawai dengan nama/alias "${nameInput}" tidak ditemukan di master data.`);
  }

  return employee;
}

export function mapAliasesToEmployees(names: string[]): Employee[] {
  const uniqueNames = Array.from(new Set(names.map(n => n.trim().toUpperCase())));
  if (uniqueNames.length !== names.length) {
    throw new Error('Terdapat duplikasi nama pegawai dalam satu baris.');
  }

  return names.map(mapAliasToEmployee);
}
