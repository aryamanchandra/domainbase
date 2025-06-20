import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDomainInfo } from '@/lib/namesilo';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || undefined;
    const info = await getDomainInfo(domain || undefined);
    return NextResponse.json({ success: true, info });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch domain info' }, { status: 500 });
  }
}


