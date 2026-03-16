import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import EmptyState from '@/components/EmptyState'
import { Github, Globe, Award, Flame, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient()
  
  if (!supabase) {
    notFound()
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('username', params.username.toLowerCase())
    .single()

  if (profileError || !profile) {
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
    <div className="container mx-auto px-4 py-16 flex flex-col gap-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-10 items-start md:items-center border-b border-white/5 pb-12">
        <div className="relative group">
           <div className="absolute inset-0 blur-2xl bg-silver/10 rounded-full"></div>
           <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 border-silver/20 bg-[#111] overflow-hidden flex items-center justify-center font-bold text-4xl text-white relative">
             {profile.avatar_url ? (
               <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
             ) : (
               profile.username[0].toUpperCase()
             )}
           </div>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {profile.display_name || profile.username}
            </h1>
            <span className="text-sm text-gray-500 font-mono">@{profile.username}</span>
          </div>

          {profile.bio && (
            <p className="text-gray-400 max-w-xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mt-2">
            {profile.github_username && (
              <Link 
                href={`https://github.com/${profile.github_username}`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-[#111] text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Github size={14} />
                <span>{profile.github_username}</span>
              </Link>
            )}
            {isOwner && (
                <Link 
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent/20 bg-accent/5 text-xs text-accent hover:bg-accent/10 transition-colors"
                >
                  <Globe size={14} />
                  <span>Edit Profile</span>
                </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            <StatsCard label="Posts" value={posts?.length || 0} icon={<Zap size={12} className="text-accent" />} />
            <StatsCard label="Streak" value={profile.streak_count || 0} icon={<Flame size={12} className="text-orange-500" />} />
            <StatsCard label="Verified" value={posts?.filter((p: any) => p.verification_status === 'verified').length || 0} icon={<Award size={12} className="text-blue-500" />} />
        </div>
      </div>

      {/* Currently Building */}
      {profile.currently_building && (
          <div className="glass-card p-6 bg-accent/[0.02] border-accent/10">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Currently Building</span>
              <p className="text-lg font-medium text-white italic">"{profile.currently_building}"</p>
          </div>
      )}

      {/* Posts Feed */}
      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider text-sm opacity-50">Build History</h2>
        
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No published builds" 
            description={isOwner 
              ? "You haven't shared any builds on your profile yet." 
              : `@{profile.username} hasn't published any build logs yet.`
            }
            showAction={isOwner}
          />
        )}
      </div>
    </div>
  )
}

function StatsCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
    return (
        <div className="glass-card p-4 flex flex-col items-center justify-center text-center gap-1 group transition-all hover:border-white/20">
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-xl font-bold text-white group-hover:text-accent transition-colors">{value}</span>
            </div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
        </div>
    )
}
