import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
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
  // @ts-ignore
  if (!metadataUsername && !profile?.username) {
    redirect('/onboarding')
  }

  return <SettingsClient initialUser={user} initialProfile={profile} />
}
