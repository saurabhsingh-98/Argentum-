import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import ProfileContent from '@/components/ProfileContent'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  
  if (!supabase) {
    notFound()
  }

  const decodedUsername = decodeURIComponent(username)

  // Fetch user profile - resilient select
  // @ts-ignore
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .ilike('username', decodedUsername)
    .single()

  if (profileError || !profile) {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) {
      // Check if this user has ANY profile. If not, they MUST onboard.
      // @ts-ignore
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
  // @ts-ignore
  const { data: posts } = await supabase
    .from('posts')
    .select('*, users(id, username, display_name, avatar_url, bio, currently_building)')
    // @ts-ignore
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  // @ts-ignore
  const isOwner = currentUser?.id === profile.id

  return (
    <ProfileContent 
      initialProfile={profile} 
      posts={posts || []} 
      isOwner={isOwner} 
    />
  )
}
