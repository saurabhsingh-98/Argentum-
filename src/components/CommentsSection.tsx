"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Heart, Reply, Trash2, Flag, SortAsc, SortDesc, User, MoreVertical, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  users: {
    username: string
    display_name: string
    avatar_url: string
    skills: string[]
  }
  likes_count?: number
  is_liked?: boolean
}

interface CommentsSectionProps {
  postId: string
  postOwnerId: string
  currentUserId?: string
}

export default function CommentsSection({ postId, postOwnerId, currentUserId }: CommentsSectionProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'liked'>('newest')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId, sortBy])

  const fetchComments = async () => {
    setLoading(true)
    let query = supabase
      .from('comments')
      .select('*, users(username, display_name, avatar_url, skills)')
      .eq('post_id', postId)

    if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query
    if (data) {
      // Fetch likes count for each comment (mocking for now as table might not exist yet)
      setComments(data as any)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setSubmitting(true)
    let finalContent = newComment
    if (replyTo) {
      finalContent = `> @${replyTo.users.username}: ${replyTo.content.slice(0, 50)}${replyTo.content.length > 50 ? '...' : ''}\n\n${newComment}`
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: finalContent
      })
      .select('*, users(username, display_name, avatar_url, skills)')
      .single()

    if (data) {
      setComments([data as any, ...comments])
      setNewComment('')
      setReplyTo(null)
      
      // Notify post owner
      if (postOwnerId !== currentUserId) {
        await supabase.from('notifications').insert({
          user_id: postOwnerId,
          from_user_id: currentUserId,
          type: 'comment',
          content: `Someone commented on your build`,
          link: `/post/${postId}`
        })
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) {
      setComments(comments.filter(c => c.id !== id))
    }
  }

  return (
    <div className="flex flex-col gap-8 mt-12">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
          <MessageCircle size={20} className="text-foreground/40" />
          Comments ({comments.length})
        </h3>
        
        <div className="flex items-center gap-4">
          <select 
            value={sortBy} 
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground cursor-pointer outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="liked">Most Liked</option>
          </select>
        </div>
      </div>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {replyTo && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border animate-fade-in">
              <span className="text-xs text-foreground/40">Replying to @{replyTo.users.username}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-foreground/40 hover:text-foreground"><X size={14}/></button>
            </div>
          )}
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What do you think about this build?"
              className="w-full bg-background border border-border rounded-2xl p-6 text-sm focus:outline-none focus:border-foreground/30 transition-all min-h-[120px] resize-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute bottom-4 right-4 silver-metallic px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-card p-8 flex flex-col items-center gap-4 border-dashed">
          <p className="text-sm text-foreground/40">You must be logged in to participate in the discussion.</p>
          <Link href="/auth/login" className="px-8 py-3 rounded-xl bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-[0.2em] hover:bg-foreground/10">Sign In</Link>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 size={24} className="animate-spin text-foreground/40" />
            <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Retrieving logs...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 text-foreground/20 font-mono text-xs uppercase tracking-widest">
            Be the first to comment on this build.
          </div>
        ) : (
          comments.map((comment, i) => (
            <div 
              key={comment.id} 
              className="glass-card p-6 flex flex-col gap-4 group animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden">
                    {comment.users.avatar_url ? (
                      <img src={comment.users.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black">{comment.users.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{comment.users.display_name || comment.users.username}</span>
                      {comment.user_id === postOwnerId && (
                        <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[8px] font-black uppercase tracking-widest text-green-500">Author</span>
                      )}
                      {comment.users.skills?.slice(0, 2).map(skill => (
                        <span key={skill} className="px-1.5 py-0.5 rounded-md bg-foreground/5 border border-border text-[8px] font-bold text-foreground/40 uppercase tracking-tighter">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-foreground/40 font-mono">@{comment.users.username} • {new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {comment.user_id === currentUserId && (
                    <button onClick={() => handleDelete(comment.id)} className="p-2 text-foreground/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button className="p-2 text-foreground/20 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

               <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap pl-13">
                {comment.content}
              </div>

              <div className="flex items-center gap-6 pl-13">
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 hover:text-red-500 transition-all">
                  <Heart size={14} />
                  <span>0</span>
                </button>
                <button onClick={() => { setReplyTo(comment); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 hover:text-foreground transition-all">
                  <Reply size={14} />
                  <span>Reply</span>
                </button>
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all ml-auto">
                  <Flag size={14} />
                  <span>Report</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
