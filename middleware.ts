import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_SEGMENT = process.env.ADMIN_SECRET_URL_SEGMENT ?? '';
const ALLOWED_IPS = process.env.ALLOWED_ADMIN_IPS?.split(',').map(s => s.trim()) ?? [];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Skip middleware for static assets early
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.') // common for favicon, images, etc.
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const isAdminPath = ADMIN_SEGMENT && path.startsWith(`/admin-${ADMIN_SEGMENT}`);
    const isHoneypot = path === '/admin' || (path.startsWith('/admin/') && !isAdminPath);

    // 🪤 Honeypot
    if (isHoneypot) {
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    // 🔐 Admin IP protection (if any)
    if (isAdminPath && ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
