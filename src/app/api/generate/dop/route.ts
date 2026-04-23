import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '@/lib/docx';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Inject fixed nominal
    data.nominal = '170000';

    const buffer = await generateDocx('dop', data);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="DOP.docx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
