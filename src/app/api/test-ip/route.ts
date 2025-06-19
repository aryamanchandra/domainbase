import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test what IP NameSilo sees when we call their API
    const namesiloTest = await fetch(
      'https://www.namesilo.com/api/dnsListRecords?version=1&type=json&key=273fbb4e4d8028a72c008fa&domain=aryamanchandra.com',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );
    
    const namesiloData = await namesiloTest.json();
    
    // Get our server's public IP from external service
    const ipifyResponse = await fetch('https://api.ipify.org?format=json');
    const ipifyData = await ipifyResponse.json();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ourDetectedIp: ipifyData.ip,
      namesiloSeesIp: namesiloData?.request?.ip,
      namesiloResponse: namesiloData,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

