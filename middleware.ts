import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rate limiting cho API endpoints
  const pathname = request.nextUrl.pathname;
  
  // Chặn debug endpoints trong production
  if (process.env.NODE_ENV === 'production') {
    const debugPaths = ['/api/debug', '/api/debug-auth', '/api/debug-orders', '/api/test-db'];
    if (debugPaths.some(path => pathname.startsWith(path))) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*'
  ]
};