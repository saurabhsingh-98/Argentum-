"use client"

import { useState, useEffect } from 'react'
import { Github, Globe, Award, Flame, Zap, Instagram, Edit3, Share2, Calendar, Rocket, Lock, AtSign, Search, MessageCircle, Loader2, ArrowUpRight, ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import EmptyState from '@/components/EmptyState'
import EditProfileModal from '@/components/EditProfileModal'
import FollowButton from '@/components/FollowButton'
import { createClient, getUserWithTimeout } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import ReportModal from './ReportModal'
import StreakModal from './StreakModal'
import FollowListModal from './FollowListModal'
import { animate } from 'framer-motion'
import { User } from '@supabase/supabase-js'

import { Post } from '@/types/post'

interface ProfileContentProps {
  initialProfile: Database['public']['Tables']['users']['Row']
  posts: Post[]
  isOwner: boolean
}

export default function ProfileContent({ initialProfile, posts, isOwner }: ProfileContentProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [animateState, setAnimateState] = useState(false)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [isMessagingLoading, setIsMessagingLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reportingPostId, setReportingPostId] = useState<string | null>(null)
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false)
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false)
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers')
  const supabase = createClient() as any
  const router = useRouter()
  useEffect(() => {
    getUserWithTimeout().then(({ user }) => {
      if (user) setCurrentUserId(user.id)
    })
    
    // Handle ?edit=true query param
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('edit') === 'true' && (isOwner || currentUserId === profile.id)) {
      setIsEditModalOpen(true)
      // Clean up URL
      const newUrl = window.location.pathname
      window.history.replaceState({ ...window.history.state }, '', newUrl)
    }
  }, [isOwner, currentUserId, profile.id])

  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => setAnimateState(true), 10)

    const fetchFollowData = async () => {
      const { user } = await getUserWithTimeout()
      
      const [followers, following, followingState] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        user ? supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', profile.id).single() : null
      ])

      setFollowCounts({
        followers: followers.count || 0,
        following: following.count || 0
      })
      if (followingState?.data) setIsFollowing(true)
    }

    fetchFollowData()
    return () => clearTimeout(timer)
  }, [profile.id, supabase])

  const handleUpdateProfile = (updatedProfile: Database['public']['Tables']['users']['Row']) => {
    setProfile(updatedProfile)
  }

  const handlePin = async (postId: string) => {
    if (!isOwner) return
    
    const newPinnedId = profile.pinned_post_id === postId ? null : postId
    
    // Optimistic update
    setProfile({ ...profile, pinned_post_id: newPinnedId })
    
    const { error } = await supabase
      .from('users')
      .update({ pinned_post_id: newPinnedId })
      .eq('id', profile.id)
    
    if (error) {
      console.error('Pin error:', error)
      setProfile({ ...profile, pinned_post_id: profile.pinned_post_id })
    }
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.id === profile.pinned_post_id) return -1
    if (b.id === profile.pinned_post_id) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const getAnimationStyle = (type: 'fade' | 'slideLeft' | 'slideBottom', delay: number, customProps?: string) => {
    const base = {
      transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      opacity: animateState ? 1 : 0,
    }

    if (type === 'slideLeft') {
      return {
        ...base,
        transform: animateState ? 'translateX(0)' : 'translateX(-20px)',
      }
    }

    if (type === 'slideBottom') {
      return {
        ...base,
        transform: animateState ? 'translateY(0)' : 'translateY(20px)',
      }
    }

    if (customProps === 'avatar') {
        return {
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
            opacity: animateState ? 1 : 0,
            transform: animateState ? 'scale(1)' : 'scale(0.8)',
        }
    }

    return base
  }

  const handleMessageClick = async () => {
    if (!profile.id) return
    setIsMessagingLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if conversation exists
      const { data: existing, error } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${profile.id}),and(participant_1.eq.${profile.id},participant_2.eq.${user.id})`)
        .single()

      if (existing) {
        router.push(`/messages/${existing.id}`)
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant_1: user.id,
            participant_2: profile.id
          })
          .select()
          .single()

        if (createError) throw createError
        router.push(`/messages/${newConv.id}`)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    } finally {
      setIsMessagingLoading(false)
    }
  }

  const computedIsOwner = isOwner || (currentUserId === profile.id)

  return (
    <div className={`min-h-screen text-foreground selection:bg-silver/30 relative ${
      profile.user_type === 'company' && profile.is_verified ? 'company-theme bg-[#050505]' : 'bg-background'
    }`}>
      {/* Floating Navigation — pushed below the sticky navbar (h-16 = 4rem) */}
      <div className="fixed top-20 left-6 z-[90] flex items-center gap-2">
        <button 
          onClick={() => router.back()}
          className="p-3 rounded-2xl bg-background/50 backdrop-blur-xl border border-border text-foreground/60 hover:text-foreground hover:bg-background/80 transition-all shadow-xl group"
          title="Go Back"
        >
          <ArrowLeft size={20} className="group-active:-translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="fixed top-20 right-6 z-[90] flex items-center gap-3">
        {isOwner && (
          <Link 
            href="/settings"
            className="p-3 rounded-2xl bg-background/50 backdrop-blur-xl border border-border text-foreground/60 hover:text-foreground hover:bg-background/80 transition-all shadow-xl group"
            title="Settings"
          >
            <Settings size={20} className="group-hover:rotate-45 transition-transform" />
          </Link>
        )}
      </div>
      {/* Hero Header Area */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b from-blue-600/20 to-transparent ${
          profile.user_type === 'company' && profile.is_verified ? 'opacity-20' : ''
        }`} />
        <div className={`mesh-gradient-bg opacity-40 ${
          profile.user_type === 'company' && profile.is_verified ? 'grayscale contrast-125' : ''
        }`} />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl" />
        
        {profile.user_type === 'company' && profile.is_verified && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        )}
        
        <div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 blur-[120px] rounded-full pointer-events-none animate-pulse ${
            profile.user_type === 'company' && profile.is_verified ? 'bg-silver/20' : 'bg-blue-500/10'
          }`} 
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-foreground/5 blur-[120px] rounded-full pointer-events-none animate-pulse" 
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-20">
        {!profile.is_public && !isOwner ? (
          <div 
            className="glass-card max-w-lg mx-auto p-16 flex flex-col items-center text-center gap-8 mt-20 animate-fade-in"
            style={getAnimationStyle('slideBottom', 100)}
          >
            <div className="w-28 h-28 rounded-[2.5rem] border-2 border-border bg-card flex items-center justify-center relative shadow-glow">
              <div className="absolute inset-0 bg-foreground/5 blur-3xl rounded-full" />
              <span className="text-4xl font-black text-foreground drop-shadow-glow relative z-10">
                {profile.display_name?.split(' ').map((word) => word[0]).join('').toUpperCase() || profile.username?.[0]?.toUpperCase()}
              </span>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center shadow-xl">
                <Lock size={18} className="text-foreground/40" />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-black text-foreground tracking-tight">{profile.username}</h2>
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-border">
                <Lock size={14} className="text-foreground/40" />
                <p className="text-foreground/40 text-xs font-bold uppercase tracking-widest">
                  This profile is private
                </p>
              </div>
            </div>

            <p className="text-foreground/40 text-sm max-w-xs leading-relaxed">
                Connect with the builder or wait for them to go public to see their shipping logs.
            </p>

            <Link 
              href="/"
              className="mt-4 px-10 py-4 rounded-2xl bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:bg-foreground/10 hover:border-foreground/20 transition-all active:scale-95"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
            {/* Sidebar / Profile Meta */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="flex flex-col items-center lg:items-start gap-6">
                <div 
                  className="relative group"
                  style={getAnimationStyle('fade', 0, 'avatar')}
                >
                  <div className="absolute -inset-1 bg-gradient-to-br from-foreground/20 to-foreground/5 rounded-[2.2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-2 border-border bg-card overflow-hidden flex items-center justify-center relative transition-all duration-700 ${
                    profile.user_type === 'company' && profile.is_verified ? 'company-glow' : 
                    profile.streak_count >= 30 ? 'elite-builder-glow' : ''
                  }`}>
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-5xl font-black text-foreground drop-shadow-glow">${profile.username ? profile.username[0].toUpperCase() : '?'}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-5xl font-black text-foreground drop-shadow-glow">
                        {profile.username ? profile.username[0].toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                </div>

                <div 
                  className="flex flex-col items-center lg:items-start gap-4"
                  style={getAnimationStyle('slideLeft', 100)}
                >
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter drop-shadow-glow">
                      {profile.display_name}
                    </h1>
                    {profile.user_type === 'company' && profile.is_verified && (
                      <div className="px-3 py-1 rounded-full bg-silver/20 border border-silver/40 flex items-center gap-2 shadow-[0_0_15px_rgba(192,192,192,0.3)]">
                        <Award size={12} className="text-silver-bright" />
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Verified Hub</span>
                      </div>
                    )}
                    {!profile.is_public && (
                      <div className="px-3 py-1 rounded-full bg-foreground/5 border border-border flex items-center gap-2">
                        <Lock size={12} className="text-foreground/40" />
                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">🔒 Private profile</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-border">
                    <AtSign size={14} className="text-foreground/40" />
                    <span className="text-sm font-bold text-foreground/40">{profile.username}</span>
                  </div>

                  {/* Follower Stats */}
                  <div className="flex items-center gap-4 mt-1 font-mono">
                    <button 
                      onClick={() => { setFollowModalTab('followers'); setIsFollowModalOpen(true); }}
                      className="flex items-center gap-1.5 hover:opacity-80 transition-all group"
                    >
                      <span className="text-sm font-black text-foreground group-hover:silver-glow-text">{followCounts.followers}</span>
                      <span className="text-[10px] text-foreground/40 uppercase tracking-widest group-hover:text-foreground/60">Followers</span>
                    </button>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <button 
                      onClick={() => { setFollowModalTab('following'); setIsFollowModalOpen(true); }}
                      className="flex items-center gap-1.5 hover:opacity-80 transition-all group"
                    >
                      <span className="text-sm font-black text-foreground group-hover:silver-glow-text">{followCounts.following}</span>
                      <span className="text-[10px] text-foreground/40 uppercase tracking-widest group-hover:text-foreground/60">Following</span>
                    </button>
                  </div>
                </div>
                <div 
                  className="flex gap-3 w-full max-w-sm"
                  style={getAnimationStyle('slideLeft', 150)}
                >
                  {isOwner ? (
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex-1 silver-metallic flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-glow"
                    >
                      <Edit3 size={14} />
                      <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex-1 flex gap-3">
                    <FollowButton 
                      followingId={profile.id} 
                      initialIsFollowing={isFollowing} 
                      onCountChange={(delta) => setFollowCounts(prev => ({ ...prev, followers: prev.followers + delta }))}
                    />
                    <button 
                      onClick={handleMessageClick}
                      disabled={isMessagingLoading}
                      className="flex-1 bg-foreground/5 border border-border flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black text-foreground uppercase tracking-widest hover:bg-foreground/10 hover:border-foreground/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isMessagingLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <MessageCircle size={14} />
                      )}
                      <span>Message</span>
                    </button>
                  </div>
                )}
                  <button className="w-12 h-12 flex items-center justify-center bg-foreground/5 border border-border rounded-2xl text-foreground/40 hover:text-foreground transition-all">
                    <Share2 size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-6 w-full pt-4 border-t border-border">
                  {profile.bio && (
                    <p 
                      className="text-foreground/40 text-sm leading-relaxed italic"
                      style={getAnimationStyle('slideLeft', 200)}
                    >
                      &quot;{profile.bio}&quot;
                    </p>
                  )}

                  <div 
                      className="flex flex-col gap-3"
                      style={getAnimationStyle('slideLeft', 250)}
                  >
                    <div className="flex items-center gap-3 text-xs text-foreground/40 font-bold uppercase tracking-widest">
                      <Rocket size={14} className="text-accent" />
                    <span>Currently: <span className="text-foreground normal-case font-medium ml-1">{profile.currently_building || 'Analyzing protocols'}</span></span>
                  </div>

                  {/* Skills tags */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-2">
                        {profile.skills.map((skill: string, i: number) => (
                            <span 
                                key={skill}
                                className="px-3 py-1 bg-foreground/5 border border-border rounded-full text-[10px] font-bold text-foreground/40"
                                style={getAnimationStyle('fade', 300 + (i * 50))}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-col gap-3">
                    {profile.open_to_work && (
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-green-500/5 border border-green-500/10 rounded-xl w-fit">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </div>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Open to work</span>
                        </div>
                    )}

                    {profile.looking_for && (
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-foreground/5 border border-border rounded-xl w-fit">
                            <Search size={12} className="text-foreground/40" />
                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                Looking for: <span className="text-foreground normal-case ml-1">{profile.looking_for}</span>
                            </span>
                        </div>
                    )}
                  </div>
                    <div className="flex items-center gap-4 py-2">
                    {profile.github_username && (
                      <Link 
                        href={`https://github.com/${profile.github_username}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-foreground/5 border border-border text-foreground/40 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/10 transition-all"
                        title="GitHub"
                      >
                        <Github size={18} />
                      </Link>
                    )}

                    {profile.instagram_username && (
                      <Link 
                        href={`https://instagram.com/${profile.instagram_username.replace('@', '')}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-foreground/5 border border-border text-foreground/40 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/10 transition-all"
                        title="Instagram"
                      >
                        <Instagram size={18} />
                      </Link>
                    )}
                    {profile.website_url && (
                      <Link 
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-foreground/5 border border-border text-foreground/40 hover:text-foreground hover:border-foreground/30 hover:bg-foreground/10 transition-all"
                        title="Website"
                      >
                        <Globe size={18} />
                      </Link>
                    )}
                  </div>

                    <div className="flex items-center gap-3 text-xs text-foreground/40 font-bold uppercase tracking-widest">
                      <Calendar size={14} />
                      <span>Joined {isMounted ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Feed */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div style={getAnimationStyle('slideBottom', 200)}>
                  <StatsCard label="Builds" value={posts?.length || 0} icon={<Zap size={20} className="text-accent" />} />
                </div>
                <div 
                  style={getAnimationStyle('slideBottom', 250)}
                  onClick={() => isOwner && setIsStreakModalOpen(true)}
                  className={isOwner ? 'cursor-pointer' : ''}
                >
                  <StatsCard 
                    label="Streak" 
                    value={profile.streak_count || 0} 
                    icon={<Flame size={20} className="text-orange-500" />} 
                    isStreak={isOwner}
                  />
                </div>
                <div style={getAnimationStyle('slideBottom', 300)}>
                  <StatsCard label="Upvotes" value={0} icon={<ArrowUpRight size={20} className="text-blue-400" />} />
                </div>
                <div style={getAnimationStyle('slideBottom', 350)}>
                  <StatsCard label="Verified" value={posts?.filter((p: any) => p.verification_status === 'verified').length || 0} icon={<Award size={20} className="text-foreground/60" />} />
                </div>
              </div>

              <div 
                  className="flex flex-col gap-8"
                  style={getAnimationStyle('fade', 350)}
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-xs font-black text-foreground/40 uppercase tracking-[0.3em]">Build History</h2>
                  <div className="flex gap-4">
                    <span className="text-[10px] font-bold text-foreground uppercase border-b border-foreground pb-1">All</span>
                    <span className="text-[11px] font-bold text-foreground/40 uppercase hover:text-foreground cursor-pointer">Releases</span>
                  </div>
                </div>
                
                {posts && posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedPosts.map((post, index) => (
                      <div 
                          key={post.id} 
                          style={getAnimationStyle('slideBottom', 350 + (index * 50))}
                      >
                        <PostCard 
                            post={post} 
                            isOwner={computedIsOwner}
                            currentUserId={currentUserId || undefined}
                            onReport={(id) => setReportingPostId(id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No shipping logs found" 
                    description={isOwner 
                      ? "You haven't initialized any builds yet. Start your streak today." 
                      : `@${profile.username} is currently formulating their first build.`
                    }
                    showAction={isOwner}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        profile={profile}
        onUpdate={handleUpdateProfile}
      />

      <ReportModal 
        isOpen={!!reportingPostId} 
        onClose={() => setReportingPostId(null)}
        postId={reportingPostId || ''}
        currentUserId={currentUserId || ''}
      />

      <StreakModal 
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        userId={profile.id}
      />

      <FollowListModal 
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        userId={profile.id}
        username={profile.username}
        initialTab={followModalTab}
      />
    </div>
  )
}

function StatsCard({ label, value, icon, isStreak }: { label: string, value: number | string, icon: React.ReactNode, isStreak?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, typeof value === 'number' ? value : 0, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    })
    return () => controls.stop()
  }, [value])

  return (
    <div className={`
      glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group transition-all hover:bg-foreground/5 hover:border-border
      ${isStreak ? 'hover:ring-1 hover:ring-orange-500/20 shadow-glow-orange/0 hover:shadow-glow-orange/10' : ''}
    `}>
      <div className={`
        w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:scale-110 transition-transform
        ${isStreak ? 'group-hover:shadow-glow-orange/50' : ''}
      `}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-black text-foreground group-hover:silver-glow-text transition-all tracking-tight">
          {typeof value === 'number' ? displayValue : value}
        </span>
        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em] mt-1">{label}</span>
      </div>
    </div>
  )
}
