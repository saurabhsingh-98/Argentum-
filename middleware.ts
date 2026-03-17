import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

const ADMIN_SEGMENT = process.env.ADMIN_SECRET_URL_SEGMENT!;
const ADMIN_IDS = process.env.ADMIN_USER_IDS?.split(',').map(s => s.trim()) ?? [];
const ALLOWED_IPS = process.env.ALLOWED_ADMIN_IPS?.split(',').map(s => s.trim()) ?? [];
const MAX_REQUESTS_PER_MINUTE = 100;
const MAX_ADMIN_ATTEMPTS = 5;
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    ?? request.headers.get('x-real-ip') 
    ?? '127.0.0.1';
  const path = request.nextUrl.pathname;
  const isAdminPath = path.startsWith(`/admin-${ADMIN_SEGMENT}`);
  const isHoneypot = path === '/admin' || path.startsWith('/admin/');

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. HONEYPOT — Log and 404
  if (isHoneypot) {
    await logSecurityAlert(supabase, 'unauthorized_access', ip, null, { 
      path, 
      message: 'Honeypot triggered — possible admin enumeration' 
    });
    return NextResponse.rewrite(new URL('/not-found', request.url));
  }

  // 2. RATE LIMITING
  const rateLimitKey = `global:${ip}`;
  const isRateLimited = await checkRateLimit(rateLimitKey, MAX_REQUESTS_PER_MINUTE, 60);
  if (isRateLimited) {
    await logSecurityAlert(supabase, 'rate_limit_exceeded', ip, null, { path });
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const { data: { user } } = await supabase.auth.getUser()

  // 3. ADMIN SECURITY
  if (isAdminPath) {
    // IP whitelist check
    if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
      await logAccessAttempt(supabase, ip, request.headers.get('user-agent'), path, false, 'IP not whitelisted');
      await logSecurityAlert(supabase, 'suspicious_ip', ip, null, { path, message: 'Non-whitelisted IP attempted admin access' });
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    if (!user) {
      await logAccessAttempt(supabase, ip, request.headers.get('user-agent'), path, false, 'Not authenticated');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Admin ID check
    if (!ADMIN_IDS.includes(user.id)) {
      await logAccessAttempt(supabase, ip, request.headers.get('user-agent'), path, false, `Unauthorized user: ${user.id}`);
      await logSecurityAlert(supabase, 'unauthorized_access', ip, user.id, { path, userId: user.id });
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    // CSRF check for mutations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      const expectedToken = generateCsrfToken(user.id);
      if (!csrfToken || csrfToken !== expectedToken) {
        await logAccessAttempt(supabase, ip, request.headers.get('user-agent'), path, false, 'CSRF token mismatch');
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    // Admin session timeout check
    const adminSessionCookie = request.cookies.get('admin_session');
    if (adminSessionCookie) {
      try {
        const sessionData = JSON.parse(atob(adminSessionCookie.value));
        const lastActive = new Date(sessionData.lastActive).getTime();
        if (Date.now() - lastActive > ADMIN_SESSION_TIMEOUT) {
          await logAccessAttempt(supabase, ip, request.headers.get('user-agent'), path, false, 'Session timeout');
          const res = NextResponse.redirect(new URL('/auth/login', request.url));
          res.cookies.delete('admin_session');
          return res;
        }
      } catch (e) {
        // Safe to ignore or delete cookie
      }
    }

    // Passed all checks — log success + refresh session
    await logAccessAttempt(supabase, ip, request.headers.get('user-agent'), path, true, null);
    
    const sessionData = btoa(JSON.stringify({ 
      userId: user.id, 
      lastActive: new Date().toISOString() 
    }));
    
    response.cookies.set('admin_session', sessionData, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 // 15 minutes
    });
  }

  // 4. BAN ENFORCEMENT & ONBOARDING (Standard User Flow)
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('username, is_banned, banned_until')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned && (!profile.banned_until || new Date(profile.banned_until) > new Date())) {
      if (!path.startsWith('/banned') && !path.startsWith('/auth/logout') && !path.includes('api')) {
        return NextResponse.redirect(new URL('/banned', request.url))
      }
    }

    if (!profile?.username && !path.startsWith('/onboarding') && !path.startsWith('/admin') && !path.includes('api')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

function generateCsrfToken(userId: string): string {
  // Simple edge-compatible hash-like token for now to restore site
  // In a real app, use Web Crypto API (SubtleCrypto)
  const secret = process.env.CSRF_SECRET || 'argentum-fallback-secret';
  const today = new Date().toISOString().split('T')[0];
  return btoa(`${userId}:${today}:${secret}`).slice(0, 32);
}

async function logSecurityAlert(supabase: any, type: string, ip: string, userId: string | null, details: any) {
  await supabase.from('security_alerts').insert({ type, ip_address: ip, user_id: userId, details });
}

async function logAccessAttempt(supabase: any, ip: string, agent: string | null, path: string, success: boolean, failure_reason: string | null) {
  // Use a background call or suppressed error for logging to avoid blocking
  supabase.from('admin_access_log').insert({
    ip_address: ip,
    user_agent: agent,
    path,
    method: 'GET',
    success,
    failure_reason
  }).then();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
