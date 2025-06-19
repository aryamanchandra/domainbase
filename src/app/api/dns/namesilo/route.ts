import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { addTxtRecord, deleteRecord, listDnsRecords } from '@/lib/namesilo';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const records = await listDnsRecords();
    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, host, value, ttl, recordId } = body;

    if (type === 'TXT') {
      await addTxtRecord(host, value, ttl ?? 3600);
      return NextResponse.json({ success: true });
    }

    if (type === 'DELETE' && recordId) {
      await deleteRecord(recordId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to modify record' }, { status: 500 });
  }
}


