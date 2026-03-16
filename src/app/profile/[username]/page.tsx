import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  
  if (!supabase) {
    notFound()
  }

  // Fetch user profile - resilient select
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, bio, currently_building, streak_count')
    .eq('username', username.toLowerCase())
    .single()

  if (profileError || !profile) {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      // Check if this user has ANY profile. If not, they MUST onboard.
      const { data: ownProfile } = await supabase
        .from('users')
        .select('username')
        .eq('id', currentUser.id)
        .single()
      
      if (!ownProfile) {
        redirect('/onboarding')
      }
    }
    notFound()
  }

  // Fetch published posts for this user
  const { data: posts } = await supabase
    .from('posts')
    .select('*, users(*)')
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isOwner = currentUser?.id === profile.id

  return (
    <ProfileClient 
      initialProfile={profile} 
      posts={posts || []} 
      isOwner={isOwner} 
    />
  )
}
