import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Admin check
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: any, error: any };

    // Ensure only admins can broadcast
    if (!profile || profile.role !== 'admin') {
      // For now, if 'role' column doesn't exist, we fallback to checking ADMIN_USER_IDS
      const adminIds = (process.env.ADMIN_USER_IDS || '').split(',');
      if (!adminIds.includes(user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json({ error: 'Missing subject or content' }, { status: 400 });
    }

    // 2. Fetch all users to send email to
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email')
      .not('email', 'is', null) as { data: any[] | null, error: any };

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users found to email.' });
    }

    console.log(`Broadcasting update to ${users.length} users: [${subject}]`);

    // 3. Send emails via Resend
    // Note: For large lists, you should use a background job/queue.
    const sender = process.env.SENDER_EMAIL || 'argentum.auth@gmail.com';
    
    // Batching logic (Resend allows up to 100 emails per batch in some plans)
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

    // For simplicity, we send them one by one if not using batch API
    // Optimized: Promise.all in small chunks if necessary.
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
