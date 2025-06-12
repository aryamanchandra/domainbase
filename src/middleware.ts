import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  const rootDomain = process.env.ROOT_DOMAIN || 'aryamanchandra.com';
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN || 'admin';
  
  // Remove port for development
  const hostWithoutPort = hostname.split(':')[0];
  
  // Check if this is the admin subdomain or localhost
  if (
    hostWithoutPort === `${adminSubdomain}.${rootDomain}` ||
    hostWithoutPort === 'localhost'
  ) {
    // This is the admin dashboard, allow normal routing
    return NextResponse.next();
  }
  
  // Check if this is the root domain or www - DON'T HANDLE THESE
  // Let the existing website handle these
  if (
    hostWithoutPort === rootDomain ||
    hostWithoutPort === `www.${rootDomain}`
  ) {
    // Return 404 or redirect - this app doesn't handle the main domain
    // You can customize this behavior
    return NextResponse.json(
      { error: 'This domain is not managed by this application' },
      { status: 404 }
    );
  }
  
  // Extract subdomain
  const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
  
  // Skip the admin subdomain from being treated as a content subdomain
  if (subdomain === adminSubdomain) {
    return NextResponse.next();
  }
  
  // If subdomain exists and is not the host itself, rewrite to subdomain page
  if (subdomain && subdomain !== hostWithoutPort) {
    // Rewrite to /subdomain/[subdomain] route
    url.pathname = `/subdomain/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
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

