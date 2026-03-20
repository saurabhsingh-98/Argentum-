"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, Zap, Hash, ArrowRight, Loader2, X, Command } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/context/SearchContext'
import { createClient } from '@/lib/supabase/client'

export default function CommandPalette() {
  const { isOpen, setIsOpen, query, setQuery } = useSearch()
  const [results, setResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const supabase = createClient() as any
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query) {
      setResults({ users: [], posts: [] })
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(4)

      const { data: postsData } = await supabase
        .from('posts')
        .select('id, title, category')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(4)

      setResults({ 
        users: usersData || [], 
        posts: postsData || [] 
      })
      setLoading(false)
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [query])

  const flattenResults = [
    ...(query ? [{ type: 'search', query }] : []),
    ...results.users.map(u => ({ type: 'user', ...u })),
    ...results.posts.map(p => ({ type: 'post', ...p }))
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flattenResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % flattenResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + flattenResults.length) % flattenResults.length)
    } else if (e.key === 'Enter') {
      const item = flattenResults[selectedIndex]
      if (!item) return

      if (item.type === 'user') router.push(`/profile/${item.username}`)
      else if (item.type === 'post') router.push(`/post/${item.id}`)
      else if (item.type === 'search') router.push(`/explore?q=${query}`)
      
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative z-10"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-border bg-foreground/5">
              <Search className="text-foreground/20" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search anything on Argentum..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-foreground/20"
              />
              <div className="flex items-center gap-2">
                {loading && <Loader2 className="animate-spin text-green-500" size={18} />}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground/20 hover:text-foreground transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {flattenResults.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {/* Global Search Option */}
                  {query && (
                    <ResultItem 
                      icon={<Search size={16} />}
                      title={`Search everything for "${query}"`}
                      subtitle="Open global results in Explore"
                      active={selectedIndex === 0}
                      onClick={() => { router.push(`/explore?q=${query}`); setIsOpen(false); setQuery(''); }}
                    />
                  )}

                  {results.users.length > 0 && (
                    <div className="px-4 py-2 mt-2 border-t border-white/5">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Builders</span>
                    </div>
                  )}
                  {results.users.map((user, i) => (
                    <ResultItem 
                      key={user.id}
                      icon={<User size={16} />}
                      title={user.display_name || user.username}
                      subtitle={`@${user.username}`}
                      active={selectedIndex === (query ? i + 1 : i)}
                      onClick={() => { router.push(`/profile/${user.username}`); setIsOpen(false); setQuery(''); }}
                    />
                  ))}

                  {results.posts.length > 0 && (
                    <div className="px-4 py-2 mt-4 border-t border-white/5">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Builds</span>
                    </div>
                  )}
                  {results.posts.map((post, i) => (
                    <ResultItem 
                      key={post.id}
                      icon={<Zap size={16} />}
                      title={post.title}
                      subtitle={`in #${post.category || 'all'}`}
                      active={selectedIndex === (query ? i + 1 + results.users.length : i + results.users.length)}
                      onClick={() => { router.push(`/post/${post.id}`); setIsOpen(false); setQuery(''); }}
                    />
                  ))}
                </div>
              ) : query ? (
                <div className="p-8 text-center flex flex-col items-center gap-4">
                  <div className="text-white/10">
                    <Hash size={40} />
                  </div>
                  <p className="text-gray-500 text-sm">No direct hits for "{query}"</p>
                  <button 
                    onClick={() => { router.push(`/explore?q=${query}`); setIsOpen(false); }}
                    className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    View global results <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center mx-auto mb-6">
                    <Command className="text-white/20" size={32} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Command Palette</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Type to find builders, specific builds, or explore the network.
                  </p>
                  
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {['#Web3', '#AI', '#Solana', '#Argentum'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setQuery(tag.replace('#', ''))}
                        className="px-4 py-1.5 rounded-full bg-foreground/5 border border-border text-[10px] font-bold text-foreground/40 hover:text-foreground hover:border-foreground/20 transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-foreground/20 bg-foreground/[0.02]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-foreground/5 border border-border">↑↓</kbd> to navigate</span>
                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-foreground/5 border border-border">↵</kbd> to select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-foreground/5 border border-border">ESC</kbd> to close
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function ResultItem({ icon, title, subtitle, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all
        ${active ? 'bg-foreground/10 translate-x-1' : 'hover:bg-foreground/5'}
      `}
    >
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center border transition-all
        ${active ? 'border-green-500 bg-green-500 text-black shadow-xl' : 'border-border bg-foreground/5 text-foreground/40'}
      `}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`text-sm font-bold transition-colors ${active ? 'text-background' : 'text-foreground/60'}`}>{title}</span>
        <span className="text-[10px] text-foreground/20 font-medium truncate">{subtitle}</span>
      </div>
      {active && (
        <div className="ml-auto text-green-500">
          <ArrowRight size={14} />
        </div>
      )}
    </div>
  )
}
