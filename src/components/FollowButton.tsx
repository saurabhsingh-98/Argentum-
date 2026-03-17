"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UserPlus, UserMinus } from 'lucide-react'

interface FollowButtonProps {
  followingId: string
  initialIsFollowing: boolean
  onCountChange?: (delta: number) => void
  className?: string
}

export default function FollowButton({ followingId, initialIsFollowing, onCountChange, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id || null)
    }
    getSession()
  }, [supabase])

  const handleFollow = async () => {
    if (!currentUserId || loading) return

    // Optimistic UI
    const previousState = isFollowing
    setIsFollowing(!previousState)
    if (onCountChange) onCountChange(previousState ? -1 : 1)

    setLoading(true)
    try {
      if (previousState) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', followingId)
        
        if (error) throw error
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: followingId
          })
        
        if (error) throw error
      }
    } catch (error) {
      console.error('Follow error:', error)
      // Revert on error
      setIsFollowing(previousState)
      if (onCountChange) onCountChange(previousState ? 1 : -1)
    } finally {
      setLoading(false)
    }
  }

  if (currentUserId === followingId) return null

  return (
    <button
      onClick={handleFollow}
      disabled={loading || !currentUserId}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98]
        ${isFollowing 
          ? 'bg-white/5 border border-white/10 text-silver hover:bg-white/10' 
          : 'silver-metallic text-[#050505] shadow-glow hover:brightness-110'
        }
        ${className || ''}
      `}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus size={14} />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus size={14} />
          <span>Follow</span>
        </>
      )}
    </button>
  )
}
