"use client"

import { ArrowBigUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

export default function UpvoteButton({ 
  postId, 
  initialUpvotes,
  isUpvoted: initialIsUpvoted 
}: { 
  postId: string, 
  initialUpvotes: number,
  isUpvoted?: boolean
}) {
  const supabase = createClient()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [isUpvoted, setIsUpvoted] = useState(initialIsUpvoted || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        alert("Please sign in to upvote")
        return
    }

    setIsLoading(true)
    const newIsUpvoted = !isUpvoted
    const newUpvotes = newIsUpvoted ? upvotes + 1 : upvotes - 1

    // Optimistic UI
    setIsUpvoted(newIsUpvoted)
    setUpvotes(newUpvotes)

    try {
      if (newIsUpvoted) {
        await supabase.rpc('increment_upvotes', { post_id_input: postId })
        
        // Fetch post details to notify owner
        const { data: post } = await supabase
          .from('posts')
          .select('user_id, title')
          .eq('id', postId)
          .single()

        if (post && post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            from_user_id: user.id,
            type: 'upvote',
            content: `${user.user_metadata?.display_name || user.user_metadata?.username || 'Someone'} upvoted your post "${post.title}"`,
            link: `/post/${postId}`
          })
        }
      } else {
        await supabase.rpc('decrement_upvotes', { post_id_input: postId })
      }
    } catch (error) {
      console.error('Error upvoting:', error)
      // Rollback
      setIsUpvoted(!newIsUpvoted)
      setUpvotes(upvotes)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isLoading}
      className={`
        flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300
        ${isUpvoted 
          ? 'bg-foreground/5 text-foreground silver-metallic ring-1 ring-border' 
          : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-foreground'
        }
        active:scale-90 disabled:opacity-50
      `}
    >
      <ArrowBigUp 
        size={24} 
        className={`transition-all ${isUpvoted ? 'fill-current' : ''}`} 
      />
      <span className="text-xs font-black font-mono leading-none">{upvotes}</span>
    </button>
  )
}
