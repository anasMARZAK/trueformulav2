import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin and /api/admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // Check session cookie or authorization header
    const authSessionCookie = req.cookies.get('proteinshop_auth_session')?.value || req.cookies.get('sb-access-token')?.value;
    const authHeader = req.headers.get('authorization');

    // If request originates from browser or API, verify role header or session
    const isApi = pathname.startsWith('/api/admin');

    if (!authSessionCookie && !authHeader) {
      if (isApi) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin authentication required.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
