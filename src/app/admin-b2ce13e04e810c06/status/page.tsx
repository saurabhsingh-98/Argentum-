"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  MessageSquare, 
  Trash2, 
  Eye, 
  EyeOff, 
  User, 
  Clock, 
  Zap,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export default function StatusModeration() {
  const supabase = createClient()
  const { token: csrfToken } = useCsrfToken()
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchUpdates = async () => {
    setLoading(true)
    const { data, count } = await supabase
      .from('status_updates')
      .select('*, users(username, display_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)

    setUpdates(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchUpdates()
  }, [page])

  const deleteUpdate = async (id: string) => {
    if (!csrfToken) return alert('CSRF missing.')
    if (!confirm('Remove this broadcast?')) return
    
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('status_updates').delete().eq('id', id)
    
    await supabase.from('admin_audit_log').insert({
      admin_id: user?.id,
      action: 'delete_status_update',
      target_type: 'status_update',
      target_id: id
    })

    fetchUpdates()
  }

  return (
    <div className="space-y-6">
      <header>
         <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground">Speak Moderation</h1>
         <p className="text-foreground/40 text-sm font-medium tracking-tight">Managing real-time premium broadcasts and global announcements.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 flex justify-center"><div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" /></div>
        ) : updates.length > 0 ? (
          updates.map((update, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={update.id}
              className="bg-card border border-border rounded-3xl p-6 hover:border-border transition-all flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                 <Zap size={24} />
              </div>

              <div className="flex-1 space-y-3">
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-foreground uppercase tracking-tight">@{update.users?.username}</span>
                    <span className="text-[10px] font-mono text-foreground/40 uppercase flex items-center gap-1.5"><Clock size={10} /> {new Date(update.created_at).toLocaleString()}</span>
                 </div>
                 <p className="text-base text-foreground/80 font-medium leading-relaxed italic">"{update.content}"</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center">
                 <button 
                   onClick={() => deleteUpdate(update.id)}
                   className="p-4 bg-red-900/10 border border-red-900/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-black transition-all"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-20 text-center opacity-30">
             <MessageSquare size={48} className="mx-auto mb-4" />
             <p className="font-black uppercase tracking-widest">No active broadcasts found</p>
          </div>
        )}
      </div>

      <div className="p-6 flex items-center justify-between text-xs font-bold text-foreground/40">
         <span>Page {page} of {Math.ceil(totalCount / 20)}</span>
         <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-border rounded-xl disabled:opacity-30 hover:bg-foreground/5 transition-all"><ChevronLeft size={16} /></button>
            <button disabled={page * 20 >= totalCount} onClick={() => setPage(p => p + 1)} className="p-2 border border-border rounded-xl disabled:opacity-30 hover:bg-foreground/5 transition-all"><ChevronRight size={16} /></button>
         </div>
      </div>
    </div>
  )
}
