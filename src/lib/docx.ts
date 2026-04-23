import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export const terbilang = (angka: number): string => {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  if (angka < 12) {
    return bilangan[angka];
  } else if (angka < 20) {
    return terbilang(angka - 10) + ' Belas';
  } else if (angka < 100) {
    return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
  } else if (angka < 200) {
    return 'Seratus ' + terbilang(angka - 100);
  } else if (angka < 1000) {
    return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
  } else if (angka < 2000) {
    return 'Seribu ' + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000);
  } else {
    return 'Angka terlalu besar';
  }
};

export const replaceAcrossTags = (xml: string, searchStr: string, replaceStr: string) => {
  if (!xml || !searchStr) return xml;
  
  const safeReplaceStr = (replaceStr || '').toString().replace(/\$/g, '$$$$');

  let regexStr = searchStr.split('').map(c => {
    if ('.*+?^${}()|[]\\'.includes(c)) return '\\' + c;
    return c;
  }).join('(?:<[^>]*>)*');
  
  try {
    let re = new RegExp(regexStr, 'g');
    return xml.replace(re, safeReplaceStr);
  } catch (e) {
    return xml.split(searchStr).join(safeReplaceStr);
  }
};

export async function generateDocx(templateName: string, data: any): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'templates', `${templateName}.docx`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName}.docx not found`);
  }

  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  // If using surat-tugas, dop or kwitansi, use XML replacement
  if (templateName === 'dop' || templateName === 'kwitansi' || templateName === 'surat-tugas') {
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) throw new Error('Could not find word/document.xml in template');
    let xml = documentFile.asText();

    const p = data;
    const anggota = p.anggota || [];
    const nama1 = anggota[0]?.nama || '';
    const nama2 = anggota[1]?.nama || '';
    const nama3 = anggota[2]?.nama || '';
    const nip1 = anggota[0]?.nip && anggota[0].nip !== '-' ? anggota[0].nip : '';
    const nip2 = anggota[1]?.nip && anggota[1].nip !== '-' ? anggota[1].nip : '';
    const nip3 = anggota[2]?.nip && anggota[2].nip !== '-' ? anggota[2].nip : '';
    const pangkat1 = anggota[0] ? `${anggota[0].golongan}` : '';
    const pangkat2 = anggota[1] ? `${anggota[1].golongan}` : '';
    const pangkat3 = anggota[2] ? `${anggota[2].golongan}` : '';
    const jabatan1 = anggota[0]?.jabatan || '';
    const jabatan2 = anggota[1]?.jabatan || '';
    const jabatan3 = anggota[2]?.jabatan || '';
    
    // Using default fixed nominals
    const nominal = 170000;
    const totalNominal = nominal * anggota.length;
    const nominalStr = nominal.toLocaleString('id-ID');
    const totalNominalStr = totalNominal.toLocaleString('id-ID');
    const terbilangStr = terbilang(nominal) + ' Rupiah';
    const terbilangTotal = terbilang(totalNominal);
    const dateStr = p.tanggal || p.tanggal_perjalanan || p.tanggal_kegiatan || '';
    const tujuanStr = p.tujuan || p.tujuan_perjalanan || '';

    if (templateName === 'dop') {
      xml = replaceAcrossTags(xml, 'Kec. Pamijahan', `Kec. ${tujuanStr}`);
      xml = replaceAcrossTags(xml, '04 Februari 2026, 1 (Satu) hari', `${dateStr}, 1 (Satu) hari`);
      xml = replaceAcrossTags(xml, 'Cibinong, 04 Februari 2026', `Cibinong, ${dateStr}`);
      xml = replaceAcrossTags(xml, 'Heri Hepriadi, S.Kom., MM', nama1);
      xml = replaceAcrossTags(xml, 'Alvi Nurfuadi', nama2);
      xml = replaceAcrossTags(xml, 'Siti Mufarihah, S.Kom', nama3);
      xml = replaceAcrossTags(xml, '510.000', totalNominalStr);
      xml = replaceAcrossTags(xml, '# Lima Ratus Sepuluh Ribu Rupiah #', `# ${terbilangTotal} Rupiah #`);
      xml = replaceAcrossTags(xml, '170.000', nominalStr);

      // Handle nomor SPPD based on screenshot: 500.9.1/ 765 - Perindustrian
      if (p.nomor_sppd) {
        xml = replaceAcrossTags(xml, '500.9.1/ 765 - Perindustrian', `500.9.1/ ${p.nomor_sppd} - Perindustrian`);
      }
    } else if (templateName === 'kwitansi') {
      xml = replaceAcrossTags(xml, 'Seratus Tujuh Puluh Ribu Rupiah', terbilangStr);
      xml = replaceAcrossTags(xml, '170.000', nominalStr);
      xml = replaceAcrossTags(xml, 'Perjalanan Dinas ke Kecamatan Babakan Madang', p.untuk_pembayaran || `Perjalanan Dinas ke Kecamatan ${tujuanStr}`);
      xml = replaceAcrossTags(xml, '1 org x 1 HOK x 170.000', p.rincian || `1 org x 1 HOK x ${nominalStr}`);
      
      // Kwitansi replacements
      xml = replaceAcrossTags(xml, 'Oemmy Ramadhany, ST', nama1);
      xml = replaceAcrossTags(xml, 'Ricky Samuel. ST', nama2);
      xml = replaceAcrossTags(xml, 'Alvi Nurfuadi', nama3);
      
      xml = replaceAcrossTags(xml, '198705172020122005', nip1);
      xml = replaceAcrossTags(xml, '199704162025041002', nip2);
      xml = replaceAcrossTags(xml, '199604222025212006', nip3);
      
      xml = replaceAcrossTags(xml, '09 Februari 2026', dateStr);
      xml = replaceAcrossTags(xml, 'Cibinong, 09 Februari 2026', `Cibinong, ${dateStr}`);
    } else if (templateName === 'surat-tugas') {
      xml = replaceAcrossTags(xml, '500.9.1/1936', p.nomor_surat || '');
      xml = replaceAcrossTags(xml, 'Program Perencanaan dan Pembangunan Industri, Kegiatan Penyusunan dan Evaluasi Rencana Pembangunan Industri Kabupaten/Kota, Sub Kegiatan Koordinasi, Sinkronisasi dan Pelaksanaan Pembangunan Sarana dan Prasarana Industri.', p.dasar_1 || 'Program Perencanaan dan Pembangunan Industri, Kegiatan Penyusunan dan Evaluasi Rencana Pembangunan Industri Kabupaten/Kota, Sub Kegiatan Koordinasi, Sinkronisasi dan Pelaksanaan Pembangunan Sarana dan Prasarana Industri.');
      xml = replaceAcrossTags(xml, 'DPA Dinas Perdagangan dan Perindustrian Kabupaten Bogor', p.dasar_2 || 'DPA Dinas Perdagangan dan Perindustrian Kabupaten Bogor');
      
      xml = replaceAcrossTags(xml, 'Oemmy Ramadhany, ST', nama1);
      xml = replaceAcrossTags(xml, '198705172020122005', nip1);
      xml = replaceAcrossTags(xml, 'Penata Muda Tk.I, III/b', pangkat1);
      xml = replaceAcrossTags(xml, 'Anggota Tim Sarana Prasarana dan Pemberdayaan Industri', jabatan1);
      
      xml = replaceAcrossTags(xml, 'Ricky Samuel, ST', nama2);
      xml = replaceAcrossTags(xml, '199704162025041002', nip2);
      xml = replaceAcrossTags(xml, 'Penata Muda, III/a', pangkat2);
      
      xml = replaceAcrossTags(xml, 'Alvi Nurfuadi', nama3);
      xml = replaceAcrossTags(xml, '199604222025212006', nip3);
      xml = replaceAcrossTags(xml, 'V, ( Lima )', pangkat3);
      
      xml = replaceAcrossTags(xml, 'Dalam Rangka Koordinasi Terkait Pelaksanaan Kegiatan Bimtek Penerapan Industri Hijau', p.dalam_rangka || '');
      xml = replaceAcrossTags(xml, 'Koordinasi, Sinkronisasi dan Pelaksanaan Pembangunan Sarana dan Prasarana Industri', p.sub_kegiatan || 'Koordinasi, Sinkronisasi dan Pelaksanaan Pembangunan Sarana dan Prasarana Industri');
      xml = replaceAcrossTags(xml, '1 (satu) hari kerja pada Hari Kamis, Tanggal 02 April 2026', p.waktu_pelaksanaan || `1 (satu) hari kerja pada Tanggal ${dateStr}`);
      xml = replaceAcrossTags(xml, 'Kecamatan Sukamakmur', tujuanStr);
      xml = replaceAcrossTags(xml, '01 April 2026', dateStr);
    }

    zip.file('word/document.xml', xml);
    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  // Fallback to Docxtemplater for other templates (like Surat Tugas)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}
