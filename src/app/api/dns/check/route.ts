import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';
import { verifyToken } from '@/lib/auth';

interface DNSRecord {
  type: string;
  value: string | string[];
  status: 'found' | 'not_found' | 'error';
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { domain, recordTypes } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const types = recordTypes || ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];
    const results: Record<string, DNSRecord> = {};

    // Check each record type
    for (const type of types) {
      try {
        let records: any;

        switch (type) {
          case 'A':
            records = await dns.resolve4(domain);
            results[type] = {
              type,
              value: records,
              status: 'found',
            };
            break;

          case 'AAAA':
            records = await dns.resolve6(domain);
            results[type] = {
              type,
              value: records,
              status: 'found',
            };
            break;

          case 'CNAME':
            records = await dns.resolveCname(domain);
            results[type] = {
              type,
              value: records,
              status: 'found',
            };
            break;

          case 'MX':
            records = await dns.resolveMx(domain);
            results[type] = {
              type,
              value: records.map((r: any) => `${r.priority} ${r.exchange}`),
              status: 'found',
            };
            break;

          case 'TXT':
            records = await dns.resolveTxt(domain);
            results[type] = {
              type,
              value: records.map((r: string[]) => r.join(' ')),
              status: 'found',
            };
            break;

          case 'NS':
            records = await dns.resolveNs(domain);
            results[type] = {
              type,
              value: records,
              status: 'found',
            };
            break;

          default:
            results[type] = {
              type,
              value: [],
              status: 'error',
            };
        }
      } catch (error: any) {
        results[type] = {
          type,
          value: [],
          status: error.code === 'ENODATA' || error.code === 'ENOTFOUND' 
            ? 'not_found' 
            : 'error',
        };
      }
    }

    return NextResponse.json({
      success: true,
      domain,
      records: results,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DNS check error:', error);
    return NextResponse.json(
      { error: 'Failed to check DNS records' },
      { status: 500 }
    );
  }
}

