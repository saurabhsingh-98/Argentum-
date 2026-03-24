"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hashContent } from '@/lib/utils/hash'
import { calculateStreak } from '@/lib/utils/streak'
import MarkdownEditor from '@/components/MarkdownEditor'
import { ChevronLeft, Globe, Lock, Zap, Plus, Loader2, Github, Check, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

const categories = ['Speak', 'Web3', 'AI', 'Mobile', 'DevTools', 'Game', 'Other']

interface NewPostClientProps {
  initialUser: User
}

export default function NewPostClient({ initialUser }: NewPostClientProps) {
  const [loading, setLoading] = useState(false)
  const [postType, setPostType] = useState<'log' | 'speak'>('log')
  const [isPriority, setIsPriority] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Other')
  const [status, setStatus] = useState<'published' | 'private'>('published')
  const [tags, setTags] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [isFetchingGithub, setIsFetchingGithub] = useState(false)
  const [githubImported, setGithubImported] = useState(false)
  const [isCollab, setIsCollab] = useState(false)
  
  const router = useRouter()
  const supabase = createClient() as any

  const fetchGithubRepo = async () => {
    if (!githubUrl.includes('github.com/')) return
    
    setIsFetchingGithub(true)
    try {
      // Cleaner URL parsing
      let url = githubUrl.trim();
      if (url.endsWith('/')) url = url.slice(0, -1);
      
      const parts = url.split('github.com/');
      if (parts.length < 2) throw new Error('Invalid GitHub URL structure');
      
      const pathSegments = parts[1].split('?')[0].split('#')[0].split('/').filter(Boolean);
      if (pathSegments.length < 2) throw new Error('Specify a full repository (e.g., user/repo)');
      
      const repoPath = `${pathSegments[0]}/${pathSegments[1]}`;

      const response = await fetch(`https://api.github.com/repos/${repoPath}`)
      if (!response.ok) throw new Error('Repository not found')
      
      const data = await response.json()
      
      setTitle(data.name)
      setContent(`### [${data.full_name}](https://github.com/${data.full_name})\n\n${data.description || 'No description provided.'}\n\n---\n*Imported from GitHub*`)
      setCategory(data.language === 'TypeScript' || data.language === 'JavaScript' ? 'DevTools' : 'Other')
      if (data.topics) {
        setTags(data.topics.join(', '))
      }
      setGithubImported(true)
      setTimeout(() => setGithubImported(false), 3000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsFetchingGithub(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialUser || loading || !content || !title) return

    setLoading(true)
    try {
      // Ensure we have a valid session before submitting (handles AbortError from Web Locks)
      let userId = initialUser.id
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) userId = session.user.id
      } catch {
        // fall back to initialUser.id
      }

      // 1. Generate SHA-256 hash
      const hash = await hashContent(content)

      // 2. Save to Supabase
      const finalCategory = postType === 'speak' ? 'Speak' : category

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          title: postType === 'speak' ? `Broadcast: ${title || 'Announcement'}` : title,
          content,
          content_hash: hash,
          category: finalCategory as any,
          status,
          is_priority: isPriority,
          is_collab: isCollab,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          verification_status: 'unverified'
        })
        .select()
        .single()

      if (error) {
        // Fallback for missing new columns (schema cache issues)
        const errorMessage = error.message || "";
        const isNewColumnError = 
          error.code === '42703' || // Column does not exist
          error.code === 'PGRST204' || // PostgREST schema cache error
          errorMessage.includes('is_priority') || 
          errorMessage.includes('is_collab') ||
          errorMessage.includes('category');

        if (isNewColumnError) {
          console.warn('First insert failed (likely schema cache), attempting resilient fallback', error)
          
          // Build a safe, purely essential fallback object for insertion, completely ignoring optional columns 
          // that could trigger `PGRST204` schema cache misses across various platforms and branches
          const fallbackObj: any = {
            user_id: userId,
            title: postType === 'speak' ? `Broadcast: ${title || 'Announcement'}` : title,
            content,
            status,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean)
          }

          const fallbackData = await supabase
            .from('posts')
            .insert(fallbackObj)
            .select()
            .single()
          
          if (fallbackData.error) throw fallbackData.error
          return router.push(`/post/${fallbackData.data.id}`)
        }
        throw error
      }

      // 3. Record Streak History
      const postDate = new Date().toISOString().split('T')[0]
      const { data: existingStreak } = await supabase
        .from('streak_history')
        .select('post_count')
        .eq('user_id', userId)
        .eq('post_date', postDate)
        .single()

      if (existingStreak) {
        await supabase
          .from('streak_history')
          .update({ post_count: existingStreak.post_count + 1 })
          .eq('user_id', userId)
          .eq('post_date', postDate)
      } else {
        await supabase
          .from('streak_history')
          .insert({
            user_id: userId,
            post_date: postDate,
            post_count: 1
          })
      }

      // 4. Recalcalculate User Streak Count
      const { data: allHistory } = await supabase
        .from('streak_history')
        .select('post_date')
        .eq('user_id', userId)
        .order('post_date', { ascending: false })

      if (allHistory) {
        const { current } = calculateStreak(allHistory)

        await supabase
          .from('users')
          .update({ streak_count: current })
          .eq('id', userId)
      }
      
      // Revalidate feed cache
      fetch('/api/posts/revalidate', { method: 'POST' }).catch(() => {})
      
      router.push(`/post/${data.id}`)
    } catch (error: any) {
      console.error('Post creation failed:', error)
      alert(error.message || "Failed to create post. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isSpeak = postType === 'speak'
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-silver/30">
      {/* Decorative Background */}
      <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-silver/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none transition-colors duration-1000 ${isSpeak ? 'bg-amber-500/10' : 'bg-blue-500/5'}`} />

      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <header className="flex items-center justify-between mb-16">
          <Link href="/" className="flex items-center gap-3 text-foreground/40 hover:text-foreground transition-all group px-4 py-2 rounded-xl bg-foreground/[0.02] border border-border/50 hover:border-border">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Abort / Back</span>
          </Link>

          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center silver-glow-sm">
                <Plus size={20} className="text-silver" />
            </div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">New Transmission</h1>
          </div>

          <div className="w-[120px]" /> {/* Spacer */}
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-12">
          {/* Post Type Selector */}
          <div className="flex justify-center">
            <div className="bg-card/50 backdrop-blur-xl border border-border p-1.5 rounded-2xl flex gap-1.5 shadow-2xl">
              <button
                type="button"
                onClick={() => setPostType('log')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  postType === 'log' ? 'bg-white text-black shadow-xl ring-1 ring-white/10' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                Build Log
              </button>
              <button
                type="button"
                onClick={() => setPostType('speak')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  postType === 'speak' ? 'bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.4)]' : 'text-foreground/60 hover:text-amber-500/60 hover:bg-amber-500/5'
                }`}
              >
                <Zap size={12} className={postType === 'speak' ? 'animate-pulse' : ''} />
                Speak
              </button>
            </div>
          </div>
          
          {/* GitHub Import Section */}
          {!isSpeak && (
            <div className="max-w-xl mx-auto w-full">
              <div className="bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-4 flex gap-3 shadow-xl">
                <div className="flex-1 relative group">
                  <Github size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-foreground transition-colors" />
                  <input 
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-[11px] text-foreground focus:outline-none focus:border-foreground/30 transition-all font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchGithubRepo}
                  disabled={isFetchingGithub || !githubUrl.includes('github.com/')}
                  className={`px-6 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2 ${githubImported ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-foreground/5 hover:bg-foreground/10 border-border'}`}
                >
                  {isFetchingGithub ? <Loader2 size={12} className="animate-spin" /> : githubImported ? <><Check size={12} /> Imported</> : 'Fetch Repo'}
                </button>
              </div>
            </div>
          )}

          <motion.div 
            layout
            className={`relative p-8 md:p-12 rounded-[3rem] border backdrop-blur-3xl shadow-3xl transition-all duration-700 ${
              isSpeak 
                ? 'bg-amber-500/[0.03] border-amber-500/30 shadow-amber-500/5' 
                : 'bg-card/30 border-border/50 shadow-black/20'
            }`}
          >
            {/* Top Section: Title */}
            <div className="flex flex-col gap-3 mb-12">
              <label className={`text-[10px] font-black uppercase tracking-[0.3em] ml-2 transition-colors ${isSpeak ? 'text-amber-500' : 'text-foreground/40'}`}>
                {isSpeak ? 'Broadcast Headline' : 'Project Identity'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isSpeak ? "Major synchronization event..." : "Untitled build log"}
                className={`bg-transparent text-4xl md:text-6xl font-black tracking-tighter focus:outline-none placeholder:opacity-10 transition-all border-b pb-6 px-2 ${
                    isSpeak ? 'text-amber-500 border-amber-500/20' : 'text-foreground border-border/50'
                }`}
              />
            </div>

            {/* Middle Section: Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {!isSpeak && (
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Sector / Category</label>
                  <div className="relative group">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none focus:border-foreground/40 transition-all appearance-none cursor-pointer group-hover:border-border/80"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft size={14} className="-rotate-90" />
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex flex-col gap-3 ${isSpeak ? 'md:col-span-2' : ''}`}>
                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Status / Visibility</label>
                <div className="flex gap-3 bg-background/50 p-1.5 rounded-2xl border border-border/50">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      status === 'published' 
                        ? 'bg-foreground/5 text-foreground border border-border' 
                        : 'text-foreground/40 hover:text-foreground'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('private')}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      status === 'private' 
                        ? 'bg-foreground/5 text-foreground border border-border' 
                        : 'text-foreground/40 hover:text-foreground'
                    }`}
                  >
                    <Lock size={14} />
                    <span>Private</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col gap-3 mb-10">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">
                {isSpeak ? 'Broadcast Payload' : 'The Build Log'}
              </label>
              <div className={`rounded-3xl border transition-all duration-700 overflow-hidden ${
                isSpeak ? 'bg-amber-500/[0.01] border-amber-500/20 focus-within:border-amber-500/40' : 'bg-background/20 border-border focus-within:border-foreground/20'
              }`}>
                <MarkdownEditor value={content} onChange={(val) => setContent(val || '')} />
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex flex-col gap-3 mb-12">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="web3, design, rust..."
                className="bg-background/50 border border-border rounded-2xl px-6 py-4 text-xs font-bold focus:outline-none focus:border-foreground/20 transition-all placeholder:opacity-20 translate-x-0"
              />
            </div>

            {/* Hyper-Priority Toggle */}
            <div className={`p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden relative group ${
              isPriority 
                ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                : 'bg-card/50 border-border hover:border-gray-800'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isPriority ? 'bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-gray-500'
                  }`}>
                    <Zap size={24} className={isPriority ? 'animate-pulse' : ''} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                       <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isPriority ? 'text-amber-500' : 'text-foreground'}`}>
                        Hyper-Priority Transmission
                       </h3>
                    </div>
                    <p className={`text-[11px] leading-relaxed max-w-sm ${isPriority ? 'text-amber-500/60' : 'text-gray-500'}`}>
                      Broadcasts bypass standard filters for subscribers and appear with high-intensity visual signatures on the global network.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isPriority ? 'text-amber-500' : 'text-foreground/20'}`}>
                    {isPriority ? 'Activated' : 'Disabled'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsPriority(!isPriority)}
                    className={`relative w-16 h-8 rounded-full transition-all duration-500 outline-none ${
                      isPriority ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/5 border border-border'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: isPriority ? 36 : 4 }}
                      className={`absolute top-1 w-6 h-6 rounded-[0.6rem] shadow-xl ${
                        isPriority ? 'bg-black' : 'bg-gray-600'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Collaboration Toggle */}
            {!isSpeak && (
              <div className={`p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden relative group ${
                isCollab 
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                  : 'bg-card/50 border-border hover:border-gray-800'
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isCollab ? 'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-gray-500'
                    }`}>
                      <Check size={24} className={isCollab ? 'animate-bounce' : ''} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                         <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isCollab ? 'text-blue-500' : 'text-foreground'}`}>
                          Open for Collaboration
                         </h3>
                      </div>
                      <p className={`text-[11px] leading-relaxed max-w-sm ${isCollab ? 'text-blue-500/60' : 'text-gray-500'}`}>
                        Mark this build as open for partnership, seeking co-founders, or contributors. It will appear in the Collab Hub.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isCollab ? 'text-blue-500' : 'text-foreground/20'}`}>
                      {isCollab ? 'Active' : 'Disabled'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setIsCollab(!isCollab)}
                      className={`relative w-16 h-8 rounded-full transition-all duration-500 outline-none ${
                        isCollab ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 border border-border'
                      }`}
                    >
                      <motion.div 
                        animate={{ x: isCollab ? 36 : 4 }}
                        className={`absolute top-1 w-6 h-6 rounded-[0.6rem] shadow-xl ${
                          isCollab ? 'bg-black' : 'bg-gray-600'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content || !title}
              className={`w-full font-black py-6 rounded-2xl transition-all shadow-3xl active:scale-[0.98] disabled:opacity-30 disabled:grayscale uppercase tracking-[0.4em] text-xs relative overflow-hidden group border border-white/10 ${
                isSpeak 
                  ? 'bg-amber-500 text-black hover:bg-amber-400' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Synchronizing...</span>
                    </>
                ) : (
                    <>
                        {isSpeak ? <Zap size={14} /> : <Plus size={14} />}
                        <span>{isSpeak ? 'Initialize Broadcast' : 'Deploy Build Log'}</span>
                    </>
                )}
              </span>
            </button>
          </motion.div>
        </form>

        <footer className="mt-20 text-center flex flex-col items-center gap-4">
            <div className="w-1 h-8 bg-gradient-to-b from-border to-transparent" />
            <p className="text-[9px] text-foreground/20 font-black uppercase tracking-[0.3em]">
                Argentum Core Submission Layer v2.0
            </p>
        </footer>
      </div>
    </div>
  )
}
