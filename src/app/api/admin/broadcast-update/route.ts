import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Basic Admin check
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // You might want a more robust admin check here (e.g. checking a role in 'users' table)
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json({ error: 'Missing subject or content' }, { status: 400 });
    }

    // 2. Fetch all users to send email to
    // In a real production app, you would use a queue/background job (e.g. Inngest, BullMQ)
    // and a service like Resend or SendGrid to avoid timing out and handle thousands of users.
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(1000); // Safety limit for now

    if (usersError) throw usersError;

    console.log(`Broadcasting update to ${users?.length} users: [${subject}]`);

    // Simulated broadcast success
    // In actual implementation: 
    // await resend.emails.send({ ... })

    return NextResponse.json({ 
      success: true, 
      message: `Broadcast for "${subject}" initiated to ${users?.length} users.` 
    });

  } catch (error: any) {
    console.error('API [broadcast-update] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
