import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  
  // Verify if admin
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) ?? [];
  if (!adminIds.includes(user.id)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const secret = process.env.CSRF_SECRET!;
  const today = new Date().toISOString().split('T')[0];
  const token = createHmac('sha256', secret)
    .update(`${user.id}:${today}`)
    .digest('hex');
  
  return NextResponse.json({ token });
}
