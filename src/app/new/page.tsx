"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hashContent } from '@/lib/utils/hash'
import MarkdownEditor from '@/components/MarkdownEditor'
import { ChevronLeft, Info, Globe, Lock } from 'lucide-react'
import Link from 'next/link'

const categories = ['Web3', 'AI', 'Mobile', 'DevTools', 'Game', 'Other']

export default function NewPost() {
  const [loading, setLoading] = useState(false)
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
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title,
          content,
          content_hash: hash,
          category: category as any,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          verification_status: 'unverified'
        })
        .select()
        .single()

      if (error) throw error
      
      router.push(`/post/${data.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 text-sm group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to feed</span>
      </Link>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you building?"
            className="bg-transparent text-4xl font-bold text-white focus:outline-none placeholder:text-gray-800"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#111] border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Visibility</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm transition-all ${
                  status === 'published' 
                    ? 'bg-accent/10 border-accent text-accent' 
                    : 'bg-[#111] border-white/5 text-gray-500'
                }`}
              >
                <Globe size={14} />
                <span>Public</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('private')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm transition-all ${
                  status === 'private' 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-[#111] border-white/5 text-gray-500'
                }`}
              >
                <Lock size={14} />
                <span>Private</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Build Log (Markdown)</label>
          <MarkdownEditor value={content} onChange={(val) => setContent(val || '')} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="web3, rust, frontend"
            className="bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-4 items-start">
            <Info className="text-accent shrink-0 mt-0.5" size={18} />
            <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-accent italic">Proof of Work</span>
                <p className="text-xs text-gray-400 leading-relaxed">
                    By publishing, a SHA-256 hash of your content will be generated and stored on-chain (coming soon) to prove the integrity and existence of your build at this point in time.
                </p>
            </div>
        </div>

        <button
          type="submit"
          disabled={loading || !content || !title}
          className="bg-accent text-black font-bold py-4 rounded-xl hover:bg-accent/90 transition-all shadow-xl shadow-accent/10 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {loading ? 'Hashing & Publishing...' : 'Publish Build Log'}
        </button>
      </form>
    </div>
  )
}
