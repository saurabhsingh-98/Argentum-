"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from '@/components/PostCard'
import BuilderCard from '@/components/BuilderCard'
import ScrollReveal from '@/components/ScrollReveal'
import { Search, Zap, Users, Loader2, ChevronDown, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'builds' | 'builders'>('builds')
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'latest' | 'upvoted' | 'verified'>('latest')
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [activeTab, sortOrder])

  const fetchData = async () => {
    setLoading(true)
    if (activeTab === 'builds') {
      let query = supabase
        .from('posts')
        .select('*, users(id, username, display_name, avatar_url, bio, currently_building, twitter_username)')
        .eq('status', 'published')

      if (sortOrder === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortOrder === 'upvoted') {
        query = query.order('upvotes', { ascending: false })
      } else if (sortOrder === 'verified') {
        query = query.eq('verification_status', 'verified').order('created_at', { ascending: false })
      }

      const { data } = await query
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
    <div className="min-h-screen bg-[#050505] py-12 md:py-24">
      <div className="container mx-auto px-4 flex flex-col gap-12">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
             <ScrollReveal direction="down">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Explore</h1>
            </ScrollReveal>
            <p className="text-gray-500 text-sm max-w-xl">
              Discover groundbreaking builds and connect with elite builders pushing the frontiers of tech.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-8">
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('builds')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'builds' ? 'bg-white text-black shadow-glow' : 'text-gray-500 hover:text-white'
                }`}
              >
                <Zap size={14} />
                <span>Builds</span>
              </button>
              <button
                onClick={() => setActiveTab('builders')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'builders' ? 'bg-white text-black shadow-glow' : 'text-gray-500 hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Builders</span>
              </button>
            </div>

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-silver transition-colors" size={16} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-mono"
              />
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-10">
          {activeTab === 'builds' && (
            <div className="flex items-center gap-4 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
              {[
                { id: 'latest', label: 'Latest', icon: <Clock size={12} /> },
                { id: 'upvoted', label: 'Most Upvoted', icon: <TrendingUp size={12} /> },
                { id: 'verified', label: 'Verified Only', icon: <CheckCircle2 size={12} /> },
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() => setSortOrder(sort.id as any)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                    sortOrder === sort.id 
                      ? 'bg-silver text-[#050505] border-silver shadow-glow' 
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {sort.icon}
                  {sort.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-silver" size={32} />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">Retrieving Data...</span>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {activeTab === 'builds' ? (
                filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <EmptyStateMsg message="No builds found matching your search parameters." />
                )
              ) : (
                filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <BuilderCard key={user.id} user={user} />
                  ))
                ) : (
                  <EmptyStateMsg message="No builders found matching your search parameters." />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function EmptyStateMsg({ message }: { message: string }) {
  return (
    <div className="col-span-full py-32 text-center flex flex-col items-center gap-4 animate-fade-in text-gray-600 font-mono text-sm uppercase tracking-widest">
      <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center opacity-20">
          //
      </div>
      <p className="max-w-xs">{message}</p>
    </div>
  )
}
