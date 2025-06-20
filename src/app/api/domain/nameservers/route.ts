import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { changeNameServers, getDomainInfo } from '@/lib/namesilo';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const info = await getDomainInfo(undefined, false);
    const nameservers: string[] = Array.isArray(info?.nameservers) ? info.nameservers : [];
    return NextResponse.json({ success: true, nameservers, info });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch nameservers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { nameservers } = body as { nameservers: string[] };
    if (!Array.isArray(nameservers) || nameservers.length === 0) {
      return NextResponse.json({ error: 'nameservers required' }, { status: 400 });
    }
    await changeNameServers(nameservers);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update nameservers' }, { status: 500 });
  }
}


