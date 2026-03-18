"use client"

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import BuilderCard from '@/components/BuilderCard'
import { Search, Zap, Users, Loader2, Filter, Sparkles, Code2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

function ExploreContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || searchParams.get('query') || ''
  
  const [activeTab, setActiveTab] = useState<'builds' | 'builders'>('builds')
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const supabase = createClient()

  const categories = [
    { id: 'All', icon: <Sparkles size={14} /> },
    { id: 'Web3', icon: <Globe size={14} /> },
    { id: 'AI', icon: <Zap size={14} /> },
    { id: 'DevTools', icon: <Code2 size={14} /> },
    { id: 'Mobile', icon: <Users size={14} /> },
  ]

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedCategory])

  const fetchData = async () => {
    setLoading(true)
    if (activeTab === 'builds') {
      let query = supabase
        .from('posts')
        .select('*, users(id, username, display_name, avatar_url, bio, currently_building, created_at, skills)')
        .eq('status', 'published')

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory)
      }

      const { data } = await query.order('created_at', { ascending: false })
      setPosts(data || [])
    } else {
      const { data } = await supabase
        .from('users')
        .select('*, posts(count)')
        .eq('is_public', true)
        .order('streak_count', { ascending: false })
      
      setUsers(data || [])
    }
    setLoading(false)
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.users?.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 lg:px-6 py-10">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-xl">
               <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Explore</h1>
               <p className="text-foreground/50 text-sm leading-relaxed">
                 Discover the next generation of software. Filter by category, 
                 search for specific tech stacks, or find elite builders to collaborate with.
               </p>
            </div>
            
            <div className="flex p-1 bg-foreground/5 rounded-full border border-border md:w-auto w-full">
              <button
                onClick={() => setActiveTab('builds')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'builds' ? 'bg-foreground text-background shadow-xl' : 'text-foreground/40 hover:text-foreground'
                }`}
              >
                <Zap size={14} /> Builds
              </button>
              <button
                onClick={() => setActiveTab('builders')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === 'builders' ? 'bg-foreground text-background shadow-xl' : 'text-foreground/40 hover:text-foreground'
                }`}
              >
                <Users size={14} /> Builders
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-foreground transition-colors" size={18} />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'builds' ? 'projects, code, tags...' : 'builders, skills, names...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-foreground/30 transition-all placeholder:text-foreground/10"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-green-500 border-green-500 text-black shadow-lg shadow-green-900/20' 
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
                 <Loader2 className="animate-spin text-green-500" size={40} />
                 <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.5em]">Synchronizing...</span>
            </div>
          ) : (
             <motion.div 
               layout
               className={`
                 ${activeTab === 'builds' 
                   ? 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6' 
                   : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'}
               `}
             >
              <AnimatePresence mode="popLayout">
                {activeTab === 'builds' ? (
                  filteredPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="break-inside-avoid"
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))
                ) : (
                  filteredUsers.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <BuilderCard user={user} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && ((activeTab === 'builds' && filteredPosts.length === 0) || (activeTab === 'builders' && filteredUsers.length === 0)) && (
            <div className="py-32 flex flex-col items-center text-center gap-4">
               <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center text-foreground/10">
                  <Filter size={32} />
               </div>
               <p className="text-foreground/40 font-mono text-xs uppercase tracking-widest">No matching results found</p>
               <button 
                 onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                 className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:underline"
               >
                 Clear all filters
               </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-6 bg-background min-h-screen">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}
