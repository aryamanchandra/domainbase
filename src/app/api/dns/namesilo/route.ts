import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { addDnsRecord, updateDnsRecord, deleteRecord, listDnsRecords } from '@/lib/namesilo';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const records = await listDnsRecords();
    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    console.error('[NameSilo API Error]', {
      message: error?.message,
      serverIp: error?.serverIp,
      responseBody: error?.responseBody?.substring(0, 500)
    });
    const status = error?.message?.includes('error 113') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to list records' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, type, host, value, ttl, distance, recordId } = body;

    if (action === 'ADD') {
      await addDnsRecord(type, host, value, ttl ?? 3600, distance);
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE' && recordId) {
      await updateDnsRecord(recordId, host, value, ttl ?? 3600, distance);
      return NextResponse.json({ success: true });
    }

    if (action === 'DELETE' && recordId) {
      await deleteRecord(recordId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  } catch (error: any) {
    const status = error?.message?.includes('error 113') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to modify record' }, { status });
  }
}


