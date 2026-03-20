import { createServerClient, type CookieOptions } from '@supabase/ssr'
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

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Prevent crashes if Supabase env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // IMPORTANT: Use getUser() for security on regulated paths, 
    // but maybe use getSession() for general paths if performance is an issue.
    // However, getUser() is required for SSR session refreshing.
    const { data: { user }, error: userError } = await supabase.auth.getUser()

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

    // 🔐 Admin protection
    if (isAdminPath) {
      if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
        return NextResponse.rewrite(new URL('/not-found', request.url));
      }
      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }

    // 🚀 Force Onboarding for logged in users without username in metadata
    // Only check for pages that aren't onboarding, auth, or static
    const isProtectedPage = !path.startsWith('/auth') && 
                            !path.startsWith('/onboarding') && 
                            !path.startsWith('/not-found');

    if (user && isProtectedPage) {
      const metadataUsername = user.user_metadata?.username || user.user_metadata?.user_name;
      
      if (!metadataUsername) {
        // Fallback: Check DB ONLY if metadata is missing
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.username) {
          // Double check we are not already redirecting to onboarding to avoid loops
          if (path !== '/onboarding') {
            return NextResponse.redirect(new URL('/onboarding', request.url))
          }
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware critical error:', error);
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

