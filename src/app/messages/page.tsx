import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Onboarding check: if no username in metadata OR DB, redirect to onboarding
  const metadataUsername = user.user_metadata?.username
  if (!metadataUsername && !profile?.username) {
    redirect('/onboarding')
  }

  return <MessagesClient initialUser={user} initialProfile={profile} />
}
