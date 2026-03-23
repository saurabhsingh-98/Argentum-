import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // 2. Create a response we can mutate (for cookie writes)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 3. Refresh Supabase auth session cookie on every request
  // This is the standard @supabase/ssr pattern — without it the server-side
  // session cookie expires and server components see no session after token refresh.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session — this writes updated cookies to the response
    await supabase.auth.getUser()
  } catch {
    // Non-fatal — continue without session refresh
  }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
