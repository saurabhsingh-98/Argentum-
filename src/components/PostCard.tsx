"use client"

import Link from 'next/link'
import { 
  CheckCircle2, 
  MessageCircle, 
  Flag, 
  MoreHorizontal, 
  ArrowUp, 
  Handshake, 
  Share2, 
  Bookmark,
  Link2,
  Check,
  Zap
} from 'lucide-react'
import { Database } from '@/types/database'
import ReactionButton from './ReactionButton'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { getGradientFromUsername, getInitials } from '@/lib/utils/ui'
import GitHubEmbed from './GitHubEmbed'

type Post = Database['public']['Tables']['posts']['Row'] & {
  users: Database['public']['Tables']['users']['Row'] | null
  post_reactions?: any[]
  comments_count?: number
}

export default function PostCard({ 
  post, 
  isOwner, 
  isPinned, 
  onPin,
  currentUserId,
  onReport
}: { 
  post: Post, 
  isOwner?: boolean, 
  isPinned?: boolean,
  onPin?: (postId: string) => void,
  currentUserId?: string,
  onReport?: (postId: string) => void
}) {
  const supabase = createClient()
  const [commentCount, setCommentCount] = useState(post.comments_count || 0)
  const [reactions, setReactions] = useState<any[]>(post.post_reactions || [])
  const [showMenu, setShowMenu] = useState(false)
  const [upvotes, setUpvotes] = useState(0) // Default to 0, fetch if needed

  useEffect(() => {
    const fetchData = async () => {
      const [{ count: cCount }, { data: reactData }] = await Promise.all([
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_reactions').select('*, users(username, avatar_url, display_name)').eq('post_id', post.id)
      ])
      if (cCount !== null) setCommentCount(cCount)
      if (reactData) setReactions(reactData)
    }
    
    if (post.comments_count === undefined) fetchData()
  }, [post.id])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    // Toast would be nice here
    setShowMenu(false)
  }

  // Extract skills (mocking if not present, but real app should have them in user object)
  const skills = (post.users as any)?.skills || ['React', 'Node.js', 'PostgreSQL']
  
  // Extract code snippet preview
  const codeMatch = post.content.match(/```(?:\w+)?\n([\s\S]*?)\n```/)
  const codeSnippet = codeMatch ? codeMatch[1].split('\n').slice(0, 4).join('\n') : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2 }}
      className={`
        relative group bg-card rounded-2xl border border-border transition-all duration-300 hover:border-foreground/20 hover:shadow-2xl
        ${post.verification_status === 'verified' ? 'border-l-2 border-l-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.05)]' : ''}
        ${(post as any).is_priority ? 'border-amber-500/50 bg-gradient-to-br from-card via-amber-500/[0.02] to-amber-500/[0.05] shadow-[0_0_50px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/20' : ''}
        ${(post.category as any) === 'Speak' && !(post as any).is_priority ? 'border-amber-500/30 bg-gradient-to-br from-card to-amber-500/5 hover:border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.03)]' : ''}
      `}
    >
      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.users?.username}`} className="relative group/avatar">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-foreground shadow-lg overflow-hidden border border-border"
                style={{ background: post.users?.avatar_url ? 'none' : getGradientFromUsername(post.users?.username || 'builder') }}
              >
                {post.users?.avatar_url ? (
                  <img src={post.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(post.users?.display_name || null, post.users?.username || 'B')
                )}
              </div>
            </Link>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${post.users?.username}`} className="text-sm font-semibold text-foreground hover:text-green-500 transition-colors">
                  {post.users?.display_name || post.users?.username}
                </Link>
                {isOwner && (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[8px] font-black text-green-500 uppercase tracking-widest">
                    Author
                  </span>
                )}
                {(post as any).is_priority && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
                    <Zap size={8} fill="currentColor" /> Priority Transmission
                  </span>
                )}
                {(post.category as any) === 'Speak' && !(post as any).is_priority && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                    <Zap size={8} fill="currentColor" /> Speak
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="font-mono">@{post.users?.username}</span>
                <span>•</span>
                <span>Joined {post.users?.created_at ? new Date(post.users.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '...'}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-foreground/40 hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={18} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-[100] p-1"
                >
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all">
                    <Bookmark size={14} /> Save to collection
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all">
                    <Share2 size={14} /> Share post
                  </button>
                  <button onClick={copyLink} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all">
                    <Link2 size={14} /> Copy link
                  </button>
                  {!isOwner && (
                    <button onClick={() => { onReport?.(post.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all">
                      <Flag size={14} /> Report post
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skills Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 3).map((skill: string) => (
            <span 
              key={skill} 
              className="px-2 py-0.5 rounded-full bg-foreground/5 border border-border text-[9px] font-bold text-foreground/40 hover:border-border/50 transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Content Area */}
        <Link href={`/post/${post.id}`} className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-green-500 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-foreground/50 line-clamp-3 leading-relaxed">
            {post.content.replace(/[#*`]/g, '')}
          </p>

          {codeSnippet && (
            <div className="mt-2 bg-background rounded-xl border border-border p-3 overflow-hidden font-mono text-[11px] text-gray-500 opacity-60 group-hover:opacity-100 transition-opacity">
              <pre className="line-clamp-4">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          )}

          {(post as any).imported_from_github && (
            <GitHubEmbed 
               repoName={post.title.replace('Ship Log: ', '')} 
               stars={128} 
               forks={24}
               language="TypeScript"
            />
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {post.category && (
              <span className="text-[10px] font-bold text-green-500/70 hover:text-green-500 transition-all font-mono">
                #{post.category.toLowerCase()}
              </span>
            )}
            <span className="text-[10px] font-bold text-foreground/20 font-mono italic">#argentum</span>
          </div>
        </Link>

        {/* Reaction + Action bar */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ReactionButton postId={post.id} initialReactions={reactions} currentUserId={currentUserId} />
            
            <div className="flex items-center gap-4 ml-2 border-l border-border pl-4">
              <Link href={`/post/${post.id}#comments`} className="flex items-center gap-1.5 text-foreground/40 hover:text-foreground transition-colors group/action">
                <MessageCircle size={16} className="group-hover/action:scale-110 transition-transform" />
                <span className="text-[10px] font-black">{commentCount}</span>
              </Link>
              <button className="flex items-center gap-1.5 text-foreground/40 hover:text-foreground transition-colors group/action">
                <ArrowUp size={16} className="group-hover/action:scale-110 transition-transform" />
                <span className="text-[10px] font-black">{post.upvotes || 0}</span>
              </button>
              <Link href={`/collab?post=${post.id}`} className="flex items-center gap-1.5 text-foreground/40 hover:text-foreground transition-colors group/action">
                <Handshake size={16} className="group-hover/action:scale-110 transition-transform" />
                <span className="text-[10px] font-black hidden md:inline">Collab</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end">
                <div className="flex items-center gap-1 text-[8px] font-mono text-foreground/20 uppercase tracking-widest">
                   {post.verification_status === 'verified' && <Check size={8} className="text-green-500" />}
                   Hash
                </div>
                <span className="text-[9px] font-mono text-foreground/10 truncate w-16 text-right">
                  {post.content_hash?.slice(0, 10)}
                </span>
             </div>
             {post.verification_status === 'verified' && (
               <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.05)]">
                 <Check size={10} className="text-green-500" />
                 <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em]">Verified</span>
               </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
