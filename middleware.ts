import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

async function fetchCachedShopStatus(): Promise<{ isOpen: boolean; force?: boolean } | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shop/status`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return { isOpen: !!data.isOpen, force: data.forceStatus };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Rate limiting cho API endpoints
  const pathname = request.nextUrl.pathname;
  
  // Chặn debug endpoints trong production
  if (process.env.NODE_ENV === 'production') {
    const debugPaths = ['/api/debug', '/api/debug-auth', '/api/debug-orders', '/api/test-db'];
    if (debugPaths.some(path => pathname.startsWith(path))) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Block public interactive pages if shop closed (not admin, not assets, not status APIs)
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/_next') && !pathname.startsWith('/api/shop') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/products') && !pathname.startsWith('/images') && !pathname.startsWith('/public')) {
    const status = await fetchCachedShopStatus();
    if (status && !status.isOpen) {
      // Allow viewing product pages & menu (read-only) but block checkout/cart/order APIs
      const blockedPaths = ['/checkout', '/cart', '/api/orders', '/api/checkout'];
      if (blockedPaths.some(p => pathname.startsWith(p))) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('closed', '1');
        return NextResponse.redirect(url);
      }
    }
  }

  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/cart',
    '/checkout',
    '/product/:path*'
  ]
};