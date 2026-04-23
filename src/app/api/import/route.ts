import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '@/lib/docx';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const { records, nomorSppd } = await req.json();

    const zip = new JSZip();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const folderName = `Record_${i + 1}_${record.tujuan.replace(/\s+/g, '_')}`;
      const folder = zip.folder(folderName);

      if (!folder) continue;

      // Prepare common data
      const data = {
        tujuan: record.tujuan,
        tanggal: record.tanggal,
        anggota: record.anggota,
        nomor_sppd: record.nomorSppd || nomorSppd || '',
        nominal: '170000',
      };

      // 1. Generate DOP
      const dopBuf = await generateDocx('dop', data);
      const tujuanClean = record.tujuan.replace(/\s+/g, '_');
      folder.file(`${tujuanClean}-DOP.docx`, dopBuf);

      // 2. Generate Kwitansi (1 file containing all 3 members)
      const kwitansiBuf = await generateDocx('kwitansi', data);
      folder.file(`${tujuanClean}-Kwitansi.docx`, kwitansiBuf);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Format date for filename: 23-April-Bulk.zip
    const now = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${now.getDate()}-${months[now.getMonth()]}-Bulk.zip`;

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${dateStr}"`,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
