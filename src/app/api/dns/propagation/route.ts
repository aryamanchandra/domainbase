import { NextRequest, NextResponse } from 'next/server';
import { Resolver } from 'dns/promises';
import { verifyToken } from '@/lib/auth';

interface DNSServer {
  name: string;
  location: string;
  coordinates: [number, number]; // [longitude, latitude]
  ip: string;
  provider: string;
}

// Global DNS servers from different providers and locations
const DNS_SERVERS: DNSServer[] = [
  // North America
  { name: 'Google US', location: 'United States', coordinates: [-95.7129, 37.0902], ip: '8.8.8.8', provider: 'Google' },
  { name: 'Cloudflare US', location: 'United States', coordinates: [-98.5795, 39.8283], ip: '1.1.1.1', provider: 'Cloudflare' },
  { name: 'Quad9 US', location: 'United States', coordinates: [-95.7129, 37.0902], ip: '9.9.9.9', provider: 'Quad9' },
  
  // Europe
  { name: 'Google EU', location: 'Europe', coordinates: [10.4515, 51.1657], ip: '8.8.4.4', provider: 'Google' },
  { name: 'Cloudflare EU', location: 'Europe', coordinates: [2.3522, 48.8566], ip: '1.0.0.1', provider: 'Cloudflare' },
  
  // Asia
  { name: 'Google India', location: 'India', coordinates: [78.9629, 20.5937], ip: '8.8.8.8', provider: 'Google' },
  { name: 'Quad9 India', location: 'India', coordinates: [77.2090, 28.6139], ip: '9.9.9.9', provider: 'Quad9' },
  { name: 'Google Asia', location: 'Asia', coordinates: [104.1954, 35.8617], ip: '8.8.8.8', provider: 'Google' },
  { name: 'Cloudflare Asia', location: 'Singapore', coordinates: [103.8198, 1.3521], ip: '1.1.1.1', provider: 'Cloudflare' },
  
  // Australia
  { name: 'Cloudflare AU', location: 'Australia', coordinates: [133.7751, -25.2744], ip: '1.1.1.1', provider: 'Cloudflare' },
  
  // South America
  { name: 'Google SA', location: 'Brazil', coordinates: [-47.8825, -15.7942], ip: '8.8.8.8', provider: 'Google' },
  
  // Africa
  { name: 'Cloudflare AF', location: 'South Africa', coordinates: [22.9375, -30.5595], ip: '1.1.1.1', provider: 'Cloudflare' },
  
  // Additional providers
  { name: 'OpenDNS', location: 'United States', coordinates: [-122.4194, 37.7749], ip: '208.67.222.222', provider: 'OpenDNS' },
  { name: 'AdGuard', location: 'Europe', coordinates: [37.6173, 55.7558], ip: '94.140.14.14', provider: 'AdGuard' },
];

async function checkDNSServer(domain: string, server: DNSServer): Promise<{
  server: DNSServer;
  status: 'resolved' | 'failed' | 'timeout';
  records: string[];
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const resolver = new Resolver();
    resolver.setServers([server.ip]);
    
    // Set timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('DNS query timeout')), 5000);
    });
    
    const resolvePromise = resolver.resolve4(domain);
    
    const records = await Promise.race([resolvePromise, timeoutPromise]) as string[];
    const responseTime = Date.now() - startTime;
    
    return {
      server,
      status: 'resolved',
      records,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.message === 'DNS query timeout') {
      return {
        server,
        status: 'timeout',
        records: [],
        responseTime,
        error: 'Timeout',
      };
    }
    
    return {
      server,
      status: 'failed',
      records: [],
      responseTime,
      error: error.code || error.message,
    };
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

    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Check DNS propagation across all servers
    console.log(`Checking DNS propagation for ${domain} across ${DNS_SERVERS.length} servers...`);
    
    const results = await Promise.all(
      DNS_SERVERS.map(server => checkDNSServer(domain, server))
    );

    // Calculate statistics
    const resolved = results.filter(r => r.status === 'resolved').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const timeout = results.filter(r => r.status === 'timeout').length;
    const totalServers = DNS_SERVERS.length;
    const propagationPercentage = Math.round((resolved / totalServers) * 100);
    
    // Get average response time for successful queries
    const successfulResults = results.filter(r => r.status === 'resolved');
    const avgResponseTime = successfulResults.length > 0
      ? Math.round(successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length)
      : 0;

    return NextResponse.json({
      success: true,
      domain,
      timestamp: new Date().toISOString(),
      statistics: {
        totalServers,
        resolved,
        failed,
        timeout,
        propagationPercentage,
        avgResponseTime,
      },
      results,
    });
  } catch (error) {
    console.error('DNS propagation check error:', error);
    return NextResponse.json(
      { error: 'Failed to check DNS propagation' },
      { status: 500 }
    );
  }
}

