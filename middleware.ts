import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define API routes that should bypass middleware
  const apiRoutes = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/images/',
    '/icons/'
  ];
  
  // Skip middleware for API routes and static files
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // For now, we'll let the client-side authentication handle route protection
  // The AppLayoutClient component already handles this
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