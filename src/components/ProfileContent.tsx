"use client"

import { useState, useEffect } from 'react'
import { Github, Globe, Award, Flame, Zap, Twitter, Instagram, Edit3, Share2, Calendar, Rocket, Lock, Globe2, AtSign, Search, Pin } from 'lucide-react'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import EmptyState from '@/components/EmptyState'
import EditProfileModal from '@/components/EditProfileModal'
import FollowButton from '@/components/FollowButton'
import { createClient } from '@/lib/supabase/client'

interface ProfileContentProps {
  initialProfile: any
  posts: any[]
  isOwner: boolean
}

export default function ProfileContent({ initialProfile, posts, isOwner }: ProfileContentProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => setAnimate(true), 10)

    const fetchFollowData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
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

  const handleUpdateProfile = (updatedProfile: any) => {
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
      opacity: animate ? 1 : 0,
    }

    if (type === 'slideLeft') {
      return {
        ...base,
        transform: animate ? 'translateX(0)' : 'translateX(-20px)',
      }
    }

    if (type === 'slideBottom') {
      return {
        ...base,
        transform: animate ? 'translateY(0)' : 'translateY(20px)',
      }
    }

    if (customProps === 'avatar') {
        return {
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
            opacity: animate ? 1 : 0,
            transform: animate ? 'scale(1)' : 'scale(0.8)',
        }
    }

    return base
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-silver/30">
      {/* Hero Header Area */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-[#050505]" />
        <div className="mesh-gradient-bg opacity-40" />
        <div className="absolute inset-0 bg-[#050505]/40 backdrop-blur-3xl" />
        
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-silver/5 blur-[120px] rounded-full pointer-events-none animate-pulse" 
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-20">
        {!profile.is_public && !isOwner ? (
          <div 
            className="glass-card max-w-lg mx-auto p-16 flex flex-col items-center text-center gap-8 mt-20 animate-fade-in"
            style={getAnimationStyle('slideBottom', 100)}
          >
            <div className="w-28 h-28 rounded-[2.5rem] border-2 border-white/5 bg-[#0d0d0d] flex items-center justify-center relative shadow-glow">
              <div className="absolute inset-0 bg-silver/10 blur-3xl rounded-full" />
              <span className="text-4xl font-black text-white drop-shadow-glow relative z-10">
                {profile.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || profile.username?.[0]?.toUpperCase()}
              </span>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-center shadow-xl">
                <Lock size={18} className="text-silver" />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight">@{profile.username}</h2>
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Lock size={14} className="text-gray-500" />
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  This profile is private
                </p>
              </div>
            </div>

            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Connect with the builder or wait for them to go public to see their shipping logs.
            </p>

            <Link 
              href="/"
              className="mt-4 px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-silver hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
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
                  <div className="absolute -inset-1 bg-gradient-to-br from-silver/40 to-white/5 rounded-[2.2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-2 border-silver/20 bg-[#0d0d0d] overflow-hidden flex items-center justify-center relative">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-black text-silver drop-shadow-glow">
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
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-glow">
                      {profile.display_name}
                    </h1>
                    {!profile.is_public && (
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                        <Lock size={12} className="text-silver" />
                        <span className="text-[10px] font-black text-silver uppercase tracking-[0.2em]">🔒 Private profile</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <AtSign size={14} className="text-gray-500" />
                    <span className="text-sm font-bold text-gray-400">@{profile.username}</span>
                  </div>

                  {/* Follower Stats */}
                  <div className="flex items-center gap-4 mt-1 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">{followCounts.followers}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Followers</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-800" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">{followCounts.following}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Following</span>
                    </div>
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
                  <FollowButton 
                    followingId={profile.id} 
                    initialIsFollowing={isFollowing} 
                    onCountChange={(delta) => setFollowCounts(prev => ({ ...prev, followers: prev.followers + delta }))}
                  />
                )}
                  <button className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                    <Share2 size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-6 w-full pt-4 border-t border-white/5">
                  {profile.bio && (
                    <p 
                      className="text-gray-400 text-sm leading-relaxed italic"
                      style={getAnimationStyle('slideLeft', 200)}
                    >
                      "{profile.bio}"
                    </p>
                  )}

                  <div 
                      className="flex flex-col gap-3"
                      style={getAnimationStyle('slideLeft', 250)}
                  >
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
                      <Rocket size={14} className="text-accent" />
                    <span>Currently: <span className="text-white normal-case font-medium ml-1">{profile.currently_building || 'Analyzing protocols'}</span></span>
                  </div>

                  {/* Skills tags */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-2">
                        {profile.skills.map((skill: string, i: number) => (
                            <span 
                                key={skill}
                                className="px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-[10px] font-bold text-gray-400"
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
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl w-fit">
                            <Search size={12} className="text-silver" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Looking for: <span className="text-white normal-case ml-1">{profile.looking_for}</span>
                            </span>
                        </div>
                    )}
                  </div>
                    <div className="flex items-center gap-4 py-2">
                    {profile.github_username && (
                      <Link 
                        href={`https://github.com/${profile.github_username}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-silver hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/5 transition-all"
                        title="GitHub"
                      >
                        <Github size={18} />
                      </Link>
                    )}
                    {profile.twitter_username && (
                      <Link 
                        href={`https://x.com/${profile.twitter_username.startsWith('@') ? profile.twitter_username.slice(1) : profile.twitter_username}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-silver hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/5 transition-all"
                        title="X (Twitter)"
                      >
                        <Twitter size={18} />
                      </Link>
                    )}
                    {profile.instagram_username && (
                      <Link 
                        href={`https://instagram.com/${profile.instagram_username.replace('@', '')}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-silver hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/5 transition-all"
                        title="Instagram"
                      >
                        <Instagram size={18} />
                      </Link>
                    )}
                    {profile.website_url && (
                      <Link 
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} 
                        target="_blank" 
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-silver hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/5 transition-all"
                        title="Website"
                      >
                        <Globe size={18} />
                      </Link>
                    )}
                  </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
                      <Calendar size={14} />
                      <span>Joined {isMounted ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '...'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Feed */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              <div className="grid grid-cols-3 gap-4">
                <div style={getAnimationStyle('slideBottom', 200)}>
                  <StatsCard label="Builds" value={posts?.length || 0} icon={<Zap size={20} className="text-accent" />} />
                </div>
                <div style={getAnimationStyle('slideBottom', 250)}>
                  <StatsCard label="Streak" value={profile.streak_count || 0} icon={<Flame size={20} className="text-orange-500" />} />
                </div>
                <div style={getAnimationStyle('slideBottom', 300)}>
                  <StatsCard label="Verified" value={posts?.filter((p: any) => p.verification_status === 'verified').length || 0} icon={<Award size={20} className="text-blue-500" />} />
                </div>
              </div>

              <div 
                  className="flex flex-col gap-8"
                  style={getAnimationStyle('fade', 350)}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Build History</h2>
                  <div className="flex gap-4">
                    <span className="text-[10px] font-bold text-white uppercase border-b border-white pb-1">All</span>
                    <span className="text-[11px] font-bold text-gray-600 uppercase hover:text-gray-400 cursor-pointer">Releases</span>
                  </div>
                </div>
                
                {posts && posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedPosts.map((post: any, index: number) => (
                      <div 
                          key={post.id} 
                          style={getAnimationStyle('slideBottom', 350 + (index * 50))}
                      >
                        <PostCard 
                            post={post} 
                            isOwner={isOwner}
                            isPinned={post.id === profile.pinned_post_id}
                            onPin={handlePin}
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
    </div>
  )
}

function StatsCard({ label, value, icon }: { label: string, value: any, icon: React.ReactNode }) {
  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-3 group transition-all hover:bg-white/[0.03] hover:border-white/20">
      <div className="w-12 h-12 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-black text-white group-hover:silver-glow-text transition-all tracking-tight">{value}</span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{label}</span>
      </div>
    </div>
  )
}
