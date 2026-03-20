import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationsClient from './NotificationsClient'
import { Database } from '@/types/database'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch initial notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      from_user:users!notifications_from_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Type assertion for notifications due to join complexity
  const typedNotifications = (notifications || []) as any

  return (
    <NotificationsClient 
      initialUser={user} 
      initialNotifications={typedNotifications} 
    />
  )
}
