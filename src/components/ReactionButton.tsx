"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PostReaction } from '@/types/post'

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'rgba(59, 130, 246, 0.5)', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'rgba(239, 68, 68, 0.5)', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' },
  { type: 'fire', emoji: '🔥', label: 'Fire', color: 'rgba(249, 115, 22, 0.5)', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' },
  { type: 'mind_blown', emoji: '🤯', label: 'Mind Blown', color: 'rgba(168, 85, 247, 0.5)', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' },
  { type: 'support', emoji: '💪', label: 'Support', color: 'rgba(34, 197, 94, 0.5)', glow: 'shadow-[0_0_15_px_rgba(34,197,94,0.5)]' },
  { type: 'thinking', emoji: '🤔', label: 'Thinking', color: 'rgba(234, 179, 8, 0.5)', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]' },
]

interface ReactionButtonProps {
  postId: string
  initialReactions?: PostReaction[]
  currentUserId?: string
}

export default function ReactionButton({ postId, initialReactions = [], currentUserId }: ReactionButtonProps) {
  const supabase = createClient() as any
  const router = useRouter()
  const [reactions, setReactions] = useState<PostReaction[]>(initialReactions)
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`post-reactions:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
        () => fetchReactions()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  const fetchReactions = async () => {
    const { data } = await supabase
      .from('post_reactions')
      .select('*, users(username, avatar_url, display_name)')
      .eq('post_id', postId)
    if (data) setReactions(data)
  }

  const handleReaction = async (type: string) => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    setShowPicker(false)

    const existing = reactions.find(r => r.user_id === currentUserId)
    const oldReactions = [...reactions]

    if (existing) {
      if (existing.reaction === type) {
        setReactions(prev => prev.filter(r => r.user_id !== currentUserId))
      } else {
        setReactions(prev => prev.map(r => r.user_id === currentUserId ? { ...r, reaction: type } : r))
      }
    } else {
      setReactions(prev => [...prev, { 
        id: 'temp-' + Date.now(),
        user_id: currentUserId, 
        reaction: type, 
        post_id: postId,
        created_at: new Date().toISOString()
      }])
    }

    try {
      if (existing) {
        if (existing.reaction === type) {
          await supabase.from('post_reactions').delete().eq('id', existing.id)
        } else {
          await supabase.from('post_reactions').update({ reaction: type }).eq('id', existing.id)
        }
      } else {
        await supabase.from('post_reactions').insert({
          post_id: postId,
          user_id: currentUserId,
          reaction: type
        })
      }
    } catch (err) {
      setReactions(oldReactions)
    } finally {
      setLoading(false)
    }
  }

  const userReaction = reactions.find(r => r.user_id === currentUserId)
  const reactionCounts = reactions.reduce((acc: Record<string, number>, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1
    return acc
  }, {})

  const sortedReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)

  const currentReactionInfo = userReaction 
    ? REACTION_TYPES.find(t => t.type === userReaction.reaction) 
    : null

  return (
    <div className="relative flex flex-col items-center gap-1 group/reaction">
      <div 
        className="relative"
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        <AnimatePresence>
          {showPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-1.5 bg-card border border-border rounded-full flex items-center gap-0.5 shadow-2xl z-50 backdrop-blur-xl"
            >
              {REACTION_TYPES.map((r, i) => (
                <motion.button
                  key={r.type}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => handleReaction(r.type)}
                  className="p-2 text-xl hover:scale-150 hover:-translate-y-2 transition-all duration-300 rounded-full hover:bg-foreground/5"
                  title={r.label}
                >
                  {r.emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => handleReaction(userReaction?.reaction || 'like')}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300
            ${userReaction 
              ? `bg-foreground/5 ${currentReactionInfo?.glow} border border-foreground/20` 
              : 'hover:bg-foreground/5 text-foreground/40 hover:text-foreground border border-transparent'
            }
          `}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : userReaction ? (
            <span className="text-base">{currentReactionInfo?.emoji}</span>
          ) : (
            <ThumbsUp size={16} />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {userReaction ? currentReactionInfo?.label : 'Like'}
          </span>
        </button>
      </div>

      {reactions.length > 0 && (
        <div className="flex items-center gap-1 opacity-60 group-hover/reaction:opacity-100 transition-opacity">
          <div className="flex items-center -space-x-1">
            {sortedReactions.map(([type]) => (
              <span key={type} className="text-[10px]">
                {REACTION_TYPES.find(r => r.type === type)?.emoji}
              </span>
            ))}
          </div>
          <span className="text-[9px] font-bold text-foreground/20 font-mono">
            {reactions.length}
          </span>
        </div>
      )}
    </div>
  )
}
