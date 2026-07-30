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

    // Role check: If session cookie exists, ensure role is admin
    if (authSessionCookie) {
      try {
        const decoded = JSON.parse(decodeURIComponent(authSessionCookie));
        if (decoded && typeof decoded === 'object' && decoded.role !== 'admin') {
          if (isApi) {
            return NextResponse.json(
              { success: false, error: 'Forbidden: Admin privilege required.' },
              { status: 403 }
            );
          }
          return NextResponse.redirect(new URL('/account', req.url));
        }
      } catch (parseError) {
        console.warn('[MIDDLEWARE SESSION PARSE WARN] Malformed session cookie:', parseError);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
