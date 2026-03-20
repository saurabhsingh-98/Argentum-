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
  const supabase = createClient() as any

  useEffect(() => {
    setIsFollowing(initialIsFollowing)
  }, [initialIsFollowing])

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

        // Notify the followed user
        const { data: follower } = await supabase
          .from('users')
          .select('display_name, username')
          .eq('id', currentUserId)
          .single()

        await supabase.from('notifications').insert({
          user_id: followingId,
          from_user_id: currentUserId,
          type: 'follow',
          content: `${follower?.display_name || follower?.username || 'Someone'} started following you`,
          link: `/profile/${follower?.username}`
        })
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
          ? 'bg-foreground/5 border border-border text-foreground/40 hover:bg-foreground/10' 
          : 'silver-metallic text-background shadow-glow hover:brightness-110'
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
