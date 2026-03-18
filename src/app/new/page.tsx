"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hashContent } from '@/lib/utils/hash'
import { calculateStreak } from '@/lib/utils/streak'
import MarkdownEditor from '@/components/MarkdownEditor'
import { ChevronLeft, Info, Globe, Lock, Zap } from 'lucide-react'
import Link from 'next/link'

const categories = ['Speak', 'Web3', 'AI', 'Mobile', 'DevTools', 'Game', 'Other']

export default function NewPost() {
  const [loading, setLoading] = useState(false)
  const [postType, setPostType] = useState<'log' | 'speak'>('log')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Other')
  const [status, setStatus] = useState<'published' | 'private'>('published')
  const [tags, setTags] = useState('')
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
    }
    checkUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading || !content) return

    setLoading(true)
    try {
      // 1. Generate SHA-256 hash
      const hash = await hashContent(content)

      // 2. Save to Supabase
      const finalCategory = postType === 'speak' ? 'Speak' : category

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: postType === 'speak' ? `Broadcast: ${title || 'Announcement'}` : title,
          content,
          content_hash: hash,
          category: finalCategory as any,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          verification_status: 'unverified'
        })
        .select()
        .single()

      if (error) throw error

      // 3. Record Streak History
      const postDate = new Date().toISOString().split('T')[0]
      const { data: existingStreak } = await supabase
        .from('streak_history')
        .select('post_count')
        .eq('user_id', user.id)
        .eq('post_date', postDate)
        .single()

      if (existingStreak) {
        await supabase
          .from('streak_history')
          .update({ post_count: existingStreak.post_count + 1 })
          .eq('user_id', user.id)
          .eq('post_date', postDate)
      } else {
        await supabase
          .from('streak_history')
          .insert({
            user_id: user.id,
            post_date: postDate,
            post_count: 1
          })
      }

      // 4. Recalcalculate User Streak Count
      const { data: allHistory } = await supabase
        .from('streak_history')
        .select('post_date')
        .eq('user_id', user.id)
        .order('post_date', { ascending: false })

      if (allHistory) {
        const { current } = calculateStreak(allHistory)

        await supabase
          .from('users')
          .update({ streak_count: current })
          .eq('id', user.id)
      }
      
      router.push(`/post/${data.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const isSpeak = postType === 'speak'
  const accentColor = isSpeak ? 'amber-500' : 'accent'
  const accentBorder = isSpeak ? 'border-amber-500/50' : 'border-accent/40'
  const accentBg = isSpeak ? 'bg-amber-500/10' : 'bg-accent/10'

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to feed</span>
        </Link>

        {/* Post Type Selector */}
        <div className="bg-[#111] border border-white/5 p-1 rounded-2xl flex gap-1">
          <button
            type="button"
            onClick={() => setPostType('log')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              postType === 'log' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Build Log
          </button>
          <button
            type="button"
            onClick={() => setPostType('speak')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              postType === 'speak' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-gray-500 hover:text-amber-500/50'
            }`}
          >
            <Zap size={10} />
            Speak
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 ${isSpeak ? 'bg-amber-500/[0.02] border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]' : 'bg-transparent border-white/5'}`}>
          <div className="flex flex-col gap-2 mb-10">
            <label className={`text-[10px] font-black uppercase tracking-[0.3em] ml-1 mb-2 block transition-colors ${isSpeak ? 'text-amber-500' : 'text-gray-500'}`}>
              {isSpeak ? 'Announcement Title' : 'Project / Build Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isSpeak ? "e.g., Major Protocol Update" : "e.g., Argentum Dashboard"}
              className={`bg-transparent text-5xl font-black tracking-tighter focus:outline-none placeholder:text-gray-900 transition-all border-b pb-4 ${isSpeak ? 'text-amber-500 border-amber-500/20 placeholder:text-amber-900/30' : 'text-white border-white/5'}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {!isSpeak && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-[#0d0d0d] border border-white/5 rounded-2xl px-5 py-3 text-xs font-bold focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={`flex flex-col gap-2 ${isSpeak ? 'md:col-span-2' : ''}`}>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Visibility</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    status === 'published' 
                      ? `${accentBg} ${accentBorder} text-${isSpeak ? 'amber-500' : 'white'}` 
                      : 'bg-[#0d0d0d] border-white/5 text-gray-500'
                  }`}
                >
                  <Globe size={14} />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('private')}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    status === 'private' 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'bg-[#0d0d0d] border-white/5 text-gray-500'
                  }`}
                >
                  <Lock size={14} />
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
              {isSpeak ? 'Broadcast Content' : 'Build Log (Markdown)'}
            </label>
            <div className={`rounded-3xl border transition-all duration-500 ${isSpeak ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-white/5'}`}>
              <MarkdownEditor value={content} onChange={(val) => setContent(val || '')} />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web3, rust, frontend"
              className="bg-[#0d0d0d] border border-white/5 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-accent transition-colors placeholder:text-gray-800"
            />
          </div>

          <div className={`${accentBg} border ${accentBorder} rounded-[1.5rem] p-6 flex gap-6 items-start mb-10`}>
              <Info className={isSpeak ? 'text-amber-500' : 'text-accent'} size={20} />
              <div className="flex flex-col gap-2">
                  <span className={`text-sm font-black italic uppercase tracking-widest ${isSpeak ? 'text-amber-500' : 'text-accent'}`}>
                    {isSpeak ? 'Premium Broadcast' : 'Proof of Work'}
                  </span>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                      {isSpeak 
                        ? "Speak broadcasts are shown with a golden border and premium glow on the global feed. They are designed for major project announcements."
                        : "By publishing, a SHA-256 hash of your content will be generated and stored on-chain (coming soon) to prove the integrity and existence of your build."}
                  </p>
              </div>
          </div>

          <button
            type="submit"
            disabled={loading || !content || !title}
            className={`w-full font-black py-5 rounded-2xl transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale uppercase tracking-[0.3em] text-[11px] ${
              isSpeak 
                ? 'bg-amber-500 text-black shadow-amber-500/20 hover:bg-amber-400' 
                : 'bg-accent text-black shadow-accent/20 hover:bg-accent/90'
            }`}
          >
            {loading ? 'Processing...' : isSpeak ? 'Broadcast Speak' : 'Publish Build Log'}
          </button>
        </div>
      </form>
    </div>
  )
}
