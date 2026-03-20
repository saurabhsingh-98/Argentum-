import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Diagnostics: Log headers and cookies for debugging
    const cookieHeader = request.headers.get('cookie');
    console.log(`[CSRF_API] Request received. Cookies present:`, !!cookieHeader);
    
    if (!user) {
      console.warn(`[CSRF_API] No active session found.`);
      return new NextResponse('Unauthorized: No session', { status: 401 });
    }
    
    // 2. Verify if admin
    const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim());
    if (!adminIds.includes(user.id)) {
      console.warn(`[CSRF_API] User ${user.email} is not in ADMIN_USER_IDS.`);
      return new NextResponse('Forbidden: Not an admin', { status: 403 });
    }

    // 3. Generate Token
    const secret = process.env.CSRF_SECRET || 'argentum_fallback_secret';
    const today = new Date().toISOString().split('T')[0];
    const token = createHmac('sha256', secret)
      .update(`${user.id}:${today}`)
      .digest('hex');
    
    return NextResponse.json({ token, expires_at: today });
  } catch (error: any) {
    console.error(`[CSRF_API] Critical Error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
