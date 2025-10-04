import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

export interface VerificationRecord {
  _id?: string;
  subdomain: string;
  service: 'spf' | 'dkim' | 'dmarc' | 'google-search-console';
  recordType: 'TXT' | 'CNAME' | 'MX';
  name: string;
  value: string;
  status: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  verifiedAt?: Date;
}

// Generate verification records for different services
function generateVerificationRecords(subdomain: string, service: string, options?: any): Partial<VerificationRecord> | null {
  const domain = `${subdomain}.${ROOT_DOMAIN}`;
  
  switch (service) {
    case 'spf':
      return {
        service: 'spf',
        recordType: 'TXT',
        name: domain,
        value: 'v=spf1 include:_spf.google.com ~all',
      };
      
    case 'dkim':
      // DKIM requires a selector, using 'default' as an example
      return {
        service: 'dkim',
        recordType: 'TXT',
        name: `default._domainkey.${domain}`,
        value: options?.dkimValue || 'v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY_HERE',
      };
      
    case 'dmarc':
      const email = options?.email || `admin@${ROOT_DOMAIN}`;
      return {
        service: 'dmarc',
        recordType: 'TXT',
        name: `_dmarc.${domain}`,
        value: `v=DMARC1; p=quarantine; rua=mailto:${email}; ruf=mailto:${email}; fo=1`,
      };
      
    case 'google-search-console':
      return {
        service: 'google-search-console',
        recordType: 'TXT',
        name: domain,
        value: options?.verificationCode || 'google-site-verification=YOUR_VERIFICATION_CODE',
      };
      
    default:
      return null;
  }
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

    const { subdomain, service, options } = await request.json();

    if (!subdomain || !service) {
      return NextResponse.json(
        { error: 'Subdomain and service are required' },
        { status: 400 }
      );
    }

    const recordData = generateVerificationRecords(subdomain, service, options);

    if (!recordData) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const verificationRecord: VerificationRecord = {
      subdomain,
      ...recordData as any,
      status: 'pending',
      createdAt: new Date(),
    };

    await db.collection('verification_records').insertOne(verificationRecord);

    return NextResponse.json({
      success: true,
      record: verificationRecord,
      instructions: getInstructions(service, recordData as VerificationRecord),
    });
  } catch (error) {
    console.error('Verification record generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate verification record' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const subdomain = request.nextUrl.searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const records = await db.collection<VerificationRecord>('verification_records')
      .find({ subdomain })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('Verification records fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification records' },
      { status: 500 }
    );
  }
}

function getInstructions(service: string, record: VerificationRecord): string {
  switch (service) {
    case 'spf':
      return 'Add this TXT record to your DNS settings to authorize email servers to send mail on behalf of your domain.';
    case 'dkim':
      return 'Add this TXT record with your DKIM public key. Generate your keys using a DKIM key generator tool.';
    case 'dmarc':
      return 'Add this TXT record to configure DMARC policy and receive email authentication reports.';
    case 'google-search-console':
      return 'Add this TXT record to verify ownership of your domain in Google Search Console.';
    default:
      return 'Add this record to your DNS settings.';
  }
}

