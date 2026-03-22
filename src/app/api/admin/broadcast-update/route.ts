import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { subject, content, token: bodyToken } = body;

    // 1. Diagnostics: Log headers and cookies for debugging
    console.log(`[API] Broadcast Update: ${subject}`);
    console.log(`[API] Headers:`, Object.fromEntries(request.headers.entries()));
    const cookieHeader = request.headers.get('cookie');
    console.log(`[API] Cookies present:`, !!cookieHeader);

    // 2. CSRF & Auth Check
    const tokenFromHeader = request.headers.get('x-csrf-token');
    const token = bodyToken || tokenFromHeader;

    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Admin check
    if (!user) {
      console.warn(`[API] Unauthorized access attempt to broadcast-update`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: any, error: any };

    // Ensure only admins can broadcast
    const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(id => id.trim());
    const isAdmin = (profile && profile.role === 'admin') || adminIds.includes(user.id);

    if (!isAdmin) {
      console.warn(`[API] Forbidden access attempt by ${user.email}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. CSRF Validation Logic
    const secret = process.env.CSRF_SECRET!;
    const today = new Date().toISOString().split('T')[0];
    const expectedToken = createHmac('sha256', secret)
      .update(`${user.id}:${today}`)
      .digest('hex');

    if (token && token !== expectedToken) {
       console.error(`[API] CSRF mismatch for user ${user.id}`);
       if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Invalid security token' }, { status: 403 });
       }
    }

    if (!subject || !content) {
      return NextResponse.json({ error: 'Missing subject or content' }, { status: 400 });
    }

    // 4. Initialize Resend inside the handler to prevent build-time evaluation
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
       console.error('RESEND_API_KEY is missing');
       return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    // 5. Fetch all users to send email to
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email')
      .not('email', 'is', null) as { data: any[] | null, error: any };

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found to email.' });
    }

    console.log(`Broadcasting update to ${users.length} users: [${subject}]`);

    // 6. Send emails via Resend
    const sender = process.env.SENDER_EMAIL || 'argentum.auth@gmail.com';
    
    const emails = (users as any[]).map(u => ({
      from: `Argentum <${sender}>`,
      to: [u.email],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff; border-radius: 20px; border: 1px solid #333;">
          <h1 style="color: #fff; border-bottom: 2px solid #555; padding-bottom: 10px;">Argentum Update</h1>
          <div style="margin: 20px 0; line-height: 1.6; color: #ccc;">
            ${content}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; color: #666; text-align: center;">
            You are receiving this because you are a builder on Argentum.<br/>
            © ${new Date().getFullYear()} Argentum Protocol
          </div>
        </div>
      `,
    }));

    for (const email of emails) {
      await resend.emails.send(email);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Broadcast for "${subject}" sent to ${users.length} users.` 
    });

  } catch (error: any) {
    console.error('API [broadcast-update] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
