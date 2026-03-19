import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_SEGMENT = process.env.ADMIN_SECRET_URL_SEGMENT ?? '';
const ALLOWED_IPS = process.env.ALLOWED_ADMIN_IPS?.split(',').map(s => s.trim()) ?? [];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Prevent crashes if Supabase env vars are missing during build/prerender
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
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const path = request.nextUrl.pathname;

    const isAdminPath =
      ADMIN_SEGMENT && path.startsWith(`/admin-${ADMIN_SEGMENT}`);

    const isHoneypot =
      path === '/admin' ||
      (path.startsWith('/admin/') && !isAdminPath);

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

    // 🚀 Force Onboarding for logged in users without username
    if (user && path !== '/onboarding' && !path.startsWith('/auth') && !path.startsWith('/api') && path !== '/not-found') {
      // Check metadata first (fast)
      const metadataUsername = user.user_metadata?.username || user.user_metadata?.user_name;
      
      if (!metadataUsername) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.username) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }
      }
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
