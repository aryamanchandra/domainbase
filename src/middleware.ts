import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  const rootDomain = process.env.ROOT_DOMAIN!;
  
  // Remove port for development
  const hostWithoutPort = hostname.split(':')[0];
  
  // Check if this is localhost - allow normal routing
  if (hostWithoutPort === 'localhost') {
    return NextResponse.next();
  }
  
  // Check if this is the root app domain (matches ROOT_DOMAIN exactly)
  if (hostWithoutPort === rootDomain) {
    // This is the main app, allow normal routing
    return NextResponse.next();
  }
  
  // Check if this is a subdomain of ROOT_DOMAIN
  if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
    // Extract the subdomain part
    const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
    
    // Rewrite to /subdomain/[subdomain] route
    url.pathname = `/subdomain/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // If we get here, the hostname doesn't match our domain at all
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
