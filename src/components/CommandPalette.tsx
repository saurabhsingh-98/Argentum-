"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Package, User as UserIcon, X, Zap, ChevronRight, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{
    posts: any[]
    users: any[]
  }>({ posts: [], users: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const supabase = createClient()
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ posts: [], users: [] })
      return
    }

    setIsLoading(true)
    const [postsRes, usersRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, category, tags')
        .or(`title.ilike.%${q}%,category.ilike.%${q}%`)
        .eq('status', 'published')
        .limit(5),
      supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .eq('is_public', true)
        .limit(5)
    ])

    setResults({
      posts: postsRes.data || [],
      users: usersRes.data || []
    })
    setIsLoading(false)
    setSelectedIndex(0)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        isOpen ? onClose() : null // Triggered from external state, so we only handle close here if needed
      }
      if (e.key === 'Escape') {
        onClose()
      }
      
      const totalResults = results.posts.length + results.users.length
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (totalResults || 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + (totalResults || 1)) % (totalResults || 1))
      }
      if (e.key === 'Enter' && totalResults > 0) {
        e.preventDefault()
        const selected = selectedIndex < results.posts.length 
          ? { type: 'post', item: results.posts[selectedIndex] }
          : { type: 'user', item: results.users[selectedIndex - results.posts.length] }
        
        if (selected.type === 'post') router.push(`/post/${selected.item.id}`)
        else router.push(`/profile/${selected.item.username}`)
        onClose()
      }
    }

    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [isOpen, onClose, results, selectedIndex, router])

  if (!isOpen) return null

  const totalResultsCount = results.posts.length + results.users.length

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0a0a0a] border border-silver/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
          <Search size={20} className="text-gray-500" />
          <input 
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search builds, builders, or tags..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 placeholder:text-gray-600 text-base"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold text-gray-500">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {isLoading && query && (
             <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-silver/20 border-t-silver rounded-full animate-spin" />
             </div>
          )}

          {!isLoading && query && totalResultsCount === 0 && (
             <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 rounded-xl border border-silver/20 flex items-center justify-center bg-[#0d0d0d] grayscale opacity-50">
                  <span className="text-xl font-bold text-silver">Ag</span>
                </div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest italic">No data matched your query</p>
             </div>
          )}

          {!query && (
             <div className="px-4 py-8 flex flex-col items-center justify-center gap-6">
                <div className="w-14 h-14 rounded-2xl border border-silver/20 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent silver-glow">
                  <Zap size={24} className="text-silver animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Global Protocol Search</h3>
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest italic">Start typing to build a connection...</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                   {['Web3', 'AI', 'Mobile', 'DevTools'].map(tag => (
                     <button 
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-silver/30 text-[10px] font-bold text-gray-500 hover:text-white transition-all text-left uppercase tracking-widest flex items-center justify-between"
                     >
                       {tag}
                       <ChevronRight size={12} className="opacity-30" />
                     </button>
                   ))}
                </div>
             </div>
          )}

          {results.posts.length > 0 && (
            <div className="mb-4">
              <h4 className="px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Hash size={12} /> Builds
              </h4>
              <div className="flex flex-col gap-1">
                {results.posts.map((post, idx) => {
                  const isSelected = selectedIndex === idx
                  return (
                    <button
                      key={post.id}
                      onClick={() => {
                        router.push(`/post/${post.id}`)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`
                        w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group
                        ${isSelected ? 'bg-white/10 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' : 'bg-transparent border-transparent'}
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-lg border flex items-center justify-center transition-all
                        ${isSelected ? 'border-silver/40 silver-glow bg-white/5' : 'border-white/5 bg-white/5'}
                      `}>
                        <Package size={18} className={isSelected ? 'text-silver' : 'text-gray-600'} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className={`text-[13px] font-bold transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {post.title}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                          {post.category}
                        </span>
                      </div>
                      <div className={`transition-all ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight size={16} className="text-silver" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <h4 className="px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <UserIcon size={12} /> Builders
              </h4>
              <div className="flex flex-col gap-1">
                {results.users.map((user, idx) => {
                  const realIdx = results.posts.length + idx
                  const isSelected = selectedIndex === realIdx
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        router.push(`/profile/${user.username}`)
                        onClose()
                      }}
                      onMouseEnter={() => setSelectedIndex(realIdx)}
                      className={`
                        w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group
                        ${isSelected ? 'bg-white/10 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]' : 'bg-transparent border-transparent'}
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-lg border overflow-hidden transition-all
                        ${isSelected ? 'border-silver/40 silver-glow' : 'border-white/5'}
                      `}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#0d0d0d] flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className={`text-[13px] font-bold transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {user.display_name || user.username}
                        </span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                          @{user.username}
                        </span>
                      </div>
                      <div className={`transition-all ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        <ChevronRight size={16} className="text-silver" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-white/5 bg-[#050505] flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-gray-600">Arrows</kbd>
                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">Navigate</span>
             </div>
             <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-gray-600">Enter</kbd>
                <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">Select</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">Protocol Search v1.0</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
