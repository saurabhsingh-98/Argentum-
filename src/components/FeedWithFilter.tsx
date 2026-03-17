"use client"

import { useState } from 'react'
import CategoryFilter from './CategoryFilter'
import InfiniteFeed from './InfiniteFeed'
import { createClient } from '@/lib/supabase/client'

export default function FeedWithFilter({ initialPosts }: { initialPosts: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [posts, setPosts] = useState(initialPosts)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const supabase = createClient()

  const handleCategoryChange = async (category: string) => {
    setIsTransitioning(true)
    setSelectedCategory(category)
    
    // Fetch first page for new category
    let query = supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building, twitter_username)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10)

    if (category !== 'All') {
      query = query.eq('category', category)
    }

    const { data } = await query
    
    setTimeout(() => {
      if (data) setPosts(data)
      setIsTransitioning(false)
    }, 400)
  }

  return (
    <div className="flex flex-col gap-10">
      <CategoryFilter 
        selected={selectedCategory} 
        onSelect={handleCategoryChange} 
      />
      
      <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <InfiniteFeed initialPosts={posts} category={selectedCategory} />
      </div>
    </div>
  )
}
