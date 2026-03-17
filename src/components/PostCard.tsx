import Link from 'next/link'
import { CheckCircle2, ArrowUpRight, User, Pin } from 'lucide-react'
import { Database } from '@/types/database'

type Post = Database['public']['Tables']['posts']['Row'] & {
  users: Database['public']['Tables']['users']['Row'] | null
}

const CATEGORY_STYLES: Record<string, string> = {
  Web3: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  AI: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  Mobile: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  DevTools: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
  Game: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  Other: 'bg-white/10 text-white border-white/20',
}

export default function PostCard({ 
  post, 
  isOwner, 
  isPinned, 
  onPin 
}: { 
  post: Post, 
  isOwner?: boolean, 
  isPinned?: boolean,
  onPin?: (postId: string) => void 
}) {
  const categoryStyle = CATEGORY_STYLES[post.category as keyof typeof CATEGORY_STYLES] || CATEGORY_STYLES.Other

  return (
    <div className="relative group">
      {isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onPin) onPin(post.id)
          }}
          className={`
            absolute top-4 right-4 z-20 p-2 rounded-xl backdrop-blur-md border transition-all
            ${isPinned 
              ? 'bg-silver/20 border-silver text-white' 
              : 'bg-white/5 border-white/10 text-gray-400 opacity-0 group-hover:opacity-100'
            }
          `}
          title={isPinned ? "Unpin post" : "Pin to top"}
        >
          <Pin size={14} className={isPinned ? 'fill-white' : ''} />
        </button>
      )}

      <Link 
        href={`/post/${post.id}`}
        className={`
          glass-card flex flex-col h-full group animate-fade-in-up transition-all
          ${isPinned ? 'ring-1 ring-silver/30 border-silver/20' : ''}
        `}
      >
      <div className="p-6 flex flex-col gap-5 h-full relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d0d0d] border border-white/5 flex items-center justify-center p-1.5 overflow-hidden ring-1 ring-white/5 group-hover:ring-white/30 transition-all">
              {post.users?.avatar_url ? (
                <img src={post.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-gray-600" />
              )}
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[11px] font-bold text-white group-hover:text-silver transition-colors">
                {post.users?.display_name || post.users?.username || 'Builder'}
              </span>
              <span className="text-[9px] text-gray-500 font-mono tracking-tighter italic">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPinned && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-silver/10 border border-silver/20">
                <span className="text-[9px] font-black text-silver uppercase tracking-widest italic">📌 Pinned</span>
              </div>
            )}
            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase tracking-widest ${categoryStyle}`}>
              {post.category}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-white leading-tight group-hover:translate-x-1 transition-transform">
              {post.title.replace(/^Ship Log: /, '')}
            </h3>
            <ArrowUpRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </div>
          <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed">
            {post.content.replace(/[#*`]/g, '').slice(0, 120)}...
          </p>
        </div>

        <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Hash</span>
              <span className="text-[10px] font-mono text-gray-500 tracking-tighter italic">
                {post.content_hash ? `${post.content_hash.slice(0, 8)}...${post.content_hash.slice(-8)}` : 'No hash'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.verification_status === 'verified' && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <CheckCircle2 size={12} className="text-silver" />
                <span className="text-[9px] font-bold text-silver uppercase tracking-tighter italic">Verified</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 transition-all">
              <span className="text-[11px] font-bold text-white font-mono group-hover:text-silver">{post.upvotes}</span>
              <span className="text-[9px] font-bold text-gray-600 uppercase">Votes</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Depth Detail */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </div>
  )
}
