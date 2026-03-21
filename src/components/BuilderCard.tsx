"use client"

import Link from 'next/link'
import { User, ShieldCheck, Zap, Lock, MapPin, Search } from 'lucide-react'
import FollowButton from './FollowButton'

interface BuilderCardProps {
  user: any
}

export default function BuilderCard({ user }: BuilderCardProps) {
  // Extract first 3 skills
  const skills = user.skills?.slice(0, 3) || []

  return (
    <Link 
      href={`/profile/${user.username}`}
      className="glass-card p-6 flex flex-col gap-6 group hover:translate-y-[-4px] transition-all relative overflow-hidden"
    >
      {/* Background visual */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-silver/5 blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl border border-border bg-bg-surface flex items-center justify-center relative overflow-hidden ring-1 ring-border-muted group-hover:ring-border-accent transition-all ${
            user.user_type === 'company' && user.is_verified ? 'company-glow' : 
            user.streak_count >= 30 ? 'elite-builder-glow' : ''
          }`}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-text-muted uppercase">{user.username[0]}</span>
            )}
          </div>
          <div className="flex flex-col -space-y-0.5">
            <h3 className="text-base font-black text-text-primary group-hover:text-text-primary/80 transition-colors">
              {user.display_name || user.username}
            </h3>
            <span className="text-[11px] text-text-muted font-mono tracking-tighter">@{user.username}</span>
            {user.user_type === 'company' && user.is_verified && (
              <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-silver uppercase tracking-widest">
                <ShieldCheck size={10} />
                Verified
              </div>
            )}
          </div>
        </div>
        
        {user.open_to_work && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/5 border border-green-500/20">
             <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </div>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Open</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {user.bio ? (
          <p className="text-xs text-text-secondary line-clamp-1 italic leading-relaxed">
            "{user.bio}"
          </p>
        ) : (
          <p className="text-xs text-text-muted italic">No bio available</p>
        )}

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill: string) => (
              <span 
                key={skill}
                className="px-2 py-0.5 bg-bg-surface border border-border rounded-md text-[9px] font-bold text-text-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="flex flex-col -space-y-1">
                <span className="text-xs font-black text-text-primary">{user.posts?.[0]?.count || 0}</span>
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Builds</span>
            </div>
            <div className="w-[1px] h-6 bg-border" />
            <div className="flex flex-col -space-y-1">
                <span className="text-xs font-black text-text-primary">{user.streak_count || 0}</span>
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Streak</span>
            </div>
        </div>

        <div onClick={(e) => e.preventDefault()}>
            <FollowButton 
                followingId={user.id} 
                initialIsFollowing={false}
                className="!px-4 !py-2 !text-[9px]"
            />
        </div>
      </div>
    </Link>
  )
}
