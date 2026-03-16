"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, Globe, Award, Flame, Zap, Twitter, Edit3, Share2, MapPin, Calendar, Rocket } from 'lucide-react'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import EmptyState from '@/components/EmptyState'
import EditProfileModal from '@/components/EditProfileModal'

interface ProfileClientProps {
  initialProfile: any
  posts: any[]
  isOwner: boolean
}

export default function ProfileClient({ initialProfile, posts, isOwner }: ProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleUpdateProfile = (updatedProfile: any) => {
    setProfile(updatedProfile)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Hero Header Area */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-[#050505]" />
        <div className="mesh-gradient-bg opacity-40" />
        <div className="absolute inset-0 bg-[#050505]/40 backdrop-blur-3xl" />
        
        {/* Animated Glows in Hero */}
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-silver/5 blur-[120px] rounded-full pointer-events-none" 
        />
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
          
          {/* Sidebar / Profile Meta */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-4 flex flex-col gap-8"
          >
            <motion.div variants={item} className="flex flex-col items-center lg:items-start gap-6">
              {/* Avatar with Glow */}
              <div className="relative group">
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

              {/* Identity */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">
                  {profile.display_name || profile.username}
                </h1>
                <div className="flex items-center gap-2 text-gray-500 font-mono mt-1">
                  <span className="text-sm">@{profile.username}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-800" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Builder</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full max-w-sm">
                {isOwner ? (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 silver-metallic flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-glow"
                  >
                    <Edit3 size={14} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                    <span>Follow</span>
                  </button>
                )}
                <button className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                  <Share2 size={18} />
                </button>
              </div>

              {/* Bio & Extended Meta */}
              <div className="flex flex-col gap-6 w-full pt-4 border-t border-white/5">
                {profile.bio && (
                  <p className="text-gray-400 text-sm leading-relaxed italic">
                    "{profile.bio}"
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <Rocket size={14} className="text-accent" />
                    <span>Currently: <span className="text-white normal-case font-medium ml-1">{profile.currently_building || 'Analyzing protocols'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <Calendar size={14} />
                    <span>Joined {isMounted ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '...'}</span>
                  </div>
                </div>

                {/* Social Links Grid */}
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {profile.github_username && (
                    <Link href={`https://github.com/${profile.github_username}`} target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/social">
                      <div className="flex items-center gap-3">
                        <Github size={16} className="text-gray-400 group-hover/social:text-white" />
                        <span className="text-xs text-gray-400 group-hover/social:text-white font-medium">{profile.github_username}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">GitHub</span>
                    </Link>
                  )}
                  {profile.x_handle && (
                    <Link href={`https://x.com/${profile.x_handle.replace('@', '')}`} target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/social">
                      <div className="flex items-center gap-3">
                        <Twitter size={16} className="text-white" />
                        <span className="text-xs text-gray-400 group-hover/social:text-white font-medium">{profile.x_handle}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">X / Twitter</span>
                    </Link>
                  )}
                  {profile.website_url && (
                    <Link href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} target="_blank" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/social">
                      <div className="flex items-center gap-3">
                        <Globe size={16} className="text-green-500" />
                        <span className="text-xs text-gray-400 group-hover/social:text-white font-medium">{profile.website_url.replace(/^https?:\/\//, '')}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">URL</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Feed */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-8 flex flex-col gap-10"
          >
            {/* Extended Stats Row */}
            <motion.div variants={item} className="grid grid-cols-3 gap-4">
              <StatsCard label="Builds" value={posts?.length || 0} icon={<Zap size={20} className="text-accent" />} />
              <StatsCard label="Streak" value={profile.streak_count || 0} icon={<Flame size={20} className="text-orange-500" />} />
              <StatsCard label="Verified" value={posts?.filter((p: any) => p.verification_status === 'verified').length || 0} icon={<Award size={20} className="text-blue-500" />} />
            </motion.div>

            {/* Build Feed */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Build History</h2>
                <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-white uppercase border-b border-white pb-1">All</span>
                  <span className="text-[11px] font-bold text-gray-600 uppercase hover:text-gray-400 cursor-pointer">Releases</span>
                </div>
              </div>
              
              {posts && posts.length > 0 ? (
                <motion.div 
                  variants={container}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {posts.map((post: any) => (
                    <motion.div key={post.id} variants={item}>
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </motion.div>
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
          </motion.div>
        </div>
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

function StatsCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
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
