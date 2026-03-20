import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export default async function HoneypotPage() {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() 
    ?? headerList.get('x-real-ip') 
    ?? 'unknown';
  const userAgent = headerList.get('user-agent');

  const supabase = await createClient();

  // Log the intrusion attempt
  // @ts-ignore
  await supabase.from('security_alerts').insert({
    type: 'unauthorized_access',
    ip_address: ip,
    details: { 
      path: '/admin', 
      message: 'Honeypot triggered — direct access to /admin',
      userAgent 
    }
  });

  // Return fake 404
  return notFound();
}
