"use client"

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import { Search, Zap, Users, Loader2, Filter, Sparkles, Code2, Globe, HelpCircle, Handshake } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function CollabContent() {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const supabase = createClient() as any

  const categories = [
    { id: 'All', icon: <Sparkles size={14} /> },
    { id: 'Web3', icon: <Globe size={14} /> },
    { id: 'AI', icon: <Zap size={14} /> },
    { id: 'DevTools', icon: <Code2 size={14} /> },
    { id: 'Mobile', icon: <Users size={14} /> },
  ]

  useEffect(() => {
    fetchCollabs()
  }, [selectedCategory])

  const fetchCollabs = async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*, users(id, username, display_name, avatar_url, bio, currently_building, created_at, skills, user_type, is_verified)')
      .eq('status', 'published')
      .eq('is_collab', true)

    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory)
    }

    const { data } = await query.order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.users?.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-500 blur-[200px] rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500 blur-[200px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 py-10 relative z-10">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Handshake size={10} />
                  Open Network
                </div>
               </div>
               <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
                  Collab <span className="text-blue-500">Hub</span>
               </h1>
               <p className="text-foreground/50 text-base leading-relaxed max-w-xl">
                 The Argentum marketplace for talent and ideas. Find projects seeking contributors, 
                 co-founders for your next ship, or strategic partners in the dev ecosystem.
               </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search opportunities, stacks, or builders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-2xl py-5 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500/30 transition-all placeholder:text-foreground/10"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-blue-500 border-blue-500 text-white shadow-xl shadow-blue-900/40' 
                      : 'bg-card border-border text-foreground/40 hover:text-foreground hover:border-foreground/20'
                  }`}
                >
                  {cat.icon}
                  {cat.id}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                 <Loader2 className="animate-spin text-blue-500" size={40} />
                 <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.5em]">Scanning Marketplace...</span>
            </div>
          ) : (
             <motion.div 
               layout
               className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
             >
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="break-inside-avoid relative group"
                  >
                    <div className="absolute -inset-[1px] bg-blue-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filteredPosts.length === 0 && (
            <div className="py-32 flex flex-col items-center text-center gap-4">
               <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center text-foreground/10">
                  <Handshake size={32} />
               </div>
               <p className="text-foreground/40 font-mono text-xs uppercase tracking-widest">No collaboration calls active in this sector</p>
               <button 
                 onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                 className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
               >
                 View all sectors
               </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function CollabPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-background min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    }>
      <CollabContent />
    </Suspense>
  )
}
