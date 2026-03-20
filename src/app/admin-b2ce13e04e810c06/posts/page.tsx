"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Filter, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  Clock,
  MessageCircle,
  Heart,
  ExternalLink,
  Crown,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export default function PostsManagement() {
  const supabase = createClient() as any
  const { token: csrfToken } = useCsrfToken()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filter, setFilter] = useState('all')

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase.from('posts').select('*, users(username, display_name, avatar_url)', { count: 'exact' })
    
    if (search) {
      query = query.or(`content.ilike.%${search}%,id.eq.${search}`)
    }

    if (filter === 'verified') query = query.eq('verification_status', 'verified')
    if (filter === 'speak') query = query.eq('category', 'Speak')

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)

    setPosts(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [search, page, filter])

  const handleModeration = async (action: string, postId: string) => {
    if (!csrfToken) return alert('CSRF token missing.')

    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (action === 'verify') {
      // @ts-ignore
      await supabase.from('posts').update({ verification_status: 'verified' }).eq('id', postId)
      // @ts-ignore
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'verify_post', target_type: 'post', target_id: postId })
    } else if (action === 'unverify') {
      // @ts-ignore
      await supabase.from('posts').update({ verification_status: 'none' }).eq('id', postId)
      // @ts-ignore
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'unverify_post', target_type: 'post', target_id: postId })
    } else if (action === 'delete') {
      if (!confirm('Permanent deletion. Proceed?')) return
      await supabase.from('posts').delete().eq('id', postId)
      // @ts-ignore
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser?.id, action: 'delete_post', target_type: 'post', target_id: postId })
    }

    fetchPosts()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter mb-2">Build Logs</h1>
           <p className="text-gray-500 text-sm font-medium tracking-tight">Content moderation and verification for the platform stream.</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search logs/content..."
            className="pl-12 pr-6 py-3 bg-card border border-border rounded-2xl w-full text-xs font-bold outline-none border-red-500/0 focus:border-red-500/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="flex items-center gap-4 text-gray-500 overflow-x-auto pb-2 scrollbar-hide">
         <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'hover:text-white'}`}>All Logs</button>
         <button onClick={() => setFilter('speak')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'speak' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'hover:text-white'}`}>Speak Broadcasts</button>
         <button onClick={() => setFilter('verified')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'verified' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'hover:text-white'}`}>Verified Entries</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <motion.div 
            layout
            key={post.id}
            className="bg-card border border-border p-6 rounded-[2rem] transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center text-xs font-black">
                     {post.users?.avatar_url ? <img src={post.users.avatar_url} className="w-full h-full object-cover" /> : post.users?.username[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-white uppercase tracking-tight">{post.users?.display_name || post.users?.username}</span>
                     <span className="text-[10px] font-mono text-gray-600">@{post.users?.username}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-mono text-gray-500">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="relative group/menu">
                     <button className="p-2 text-gray-600 hover:text-white rounded-xl transition-all"><MoreHorizontal size={14} /></button>
                     <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden p-1">
                        <button onClick={() => handleModeration('delete', post.id)} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-[9px] font-black uppercase flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                     </div>
                  </div>
               </div>
            </div>

            <p className="text-sm text-gray-300 mb-6 leading-relaxed line-clamp-3">{post.content}</p>

            {post.image_url && (
              <div className="aspect-video rounded-3xl overflow-hidden border border-white/5 mb-6 bg-white/2">
                 <img src={post.image_url} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4 text-gray-500">
                  <div className="flex items-center gap-1.5"><Heart size={14} /> <span className="text-[10px] font-bold">{post.likes_count || 0}</span></div>
                  <div className="flex items-center gap-1.5"><MessageCircle size={14} /> <span className="text-[10px] font-bold">0</span></div>
               </div>
               
               <div className="flex items-center gap-2">
                  {post.category === 'Speak' && (
                    post.verification_status === 'verified' ? (
                      <button 
                        onClick={() => handleModeration('unverify', post.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-green-400 transition-all"
                      >
                        <ShieldCheck size={12} /> Verified
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleModeration('verify', post.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-white/10 transition-all"
                      >
                        <Zap size={12} /> Verify Speak
                      </button>
                    )
                  )}
                  <button onClick={() => window.open(`/post/${post.id}`, '_blank')} className="p-2 text-gray-500 hover:text-white transition-all"><ExternalLink size={14} /></button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 flex items-center justify-between text-xs font-bold text-gray-600">
         <span>Showing {posts.length} entries of {totalCount}</span>
         <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-white/5 rounded-xl disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button disabled={page * 20 >= totalCount} onClick={() => setPage(p => p + 1)} className="p-2 border border-white/5 rounded-xl disabled:opacity-30"><ChevronRight size={16} /></button>
         </div>
      </div>
    </div>
  )
}
