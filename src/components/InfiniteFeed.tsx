"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from './PostCard'
import { Loader2 } from 'lucide-react'

interface InfiniteFeedProps {
  initialPosts: any[]
  category: string
}

export default function InfiniteFeed({ initialPosts, category }: InfiniteFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === 10)
  const [page, setPage] = useState(1)
  const supabase = createClient()

  useEffect(() => {
    setPosts(initialPosts)
    setPage(1)
    setHasMore(initialPosts.length === 10)
  }, [initialPosts])

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const start = page * 10
    const end = start + 9

    let query = supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building, twitter_username)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(start, end)

    if (category !== 'All') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading more posts:', error)
    } else {
      if (data && data.length > 0) {
        setPosts([...posts, ...data])
        setPage(page + 1)
        setHasMore(data.length === 10)
      } else {
        setHasMore(false)
      }
    }
    setLoading(true) // Artificially keep loading for a bit for smooth UI
    setTimeout(() => setLoading(false), 500)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-silver hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <span>Load More Builds</span>
            )}
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-10">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">End of Transmission</span>
        </div>
      )}

      {posts.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center gap-4 animate-fade-in text-gray-600 font-mono text-sm uppercase tracking-widest">
          <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center opacity-20">
              //
          </div>
          No data found in sector: {category}
        </div>
      )}
    </div>
  )
}
