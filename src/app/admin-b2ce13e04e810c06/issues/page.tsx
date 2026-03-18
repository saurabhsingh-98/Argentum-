"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Bug, 
  CheckCircle2, 
  Clock, 
  User, 
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Filter,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export default function IssuesManagement() {
  const supabase = createClient()
  const { token: csrfToken } = useCsrfToken()
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')

  const fetchIssues = async () => {
    setLoading(true)
    let query = supabase.from('issue_reports').select('*, users(username, display_name)')
    
    if (filter !== 'all') query = query.eq('status', filter)
    
    const { data } = await query.order('created_at', { ascending: false })
    setIssues(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchIssues()
  }, [filter])

  const resolveIssue = async (id: string) => {
    if (!csrfToken) return alert('CSRF missing.')
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('issue_reports').update({ 
      status: 'closed',
      updated_at: new Date().toISOString()
    }).eq('id', id)

    await supabase.from('admin_audit_log').insert({
      admin_id: user?.id,
      action: 'resolve_issue',
      target_type: 'issue',
      target_id: id
    })

    fetchIssues()
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground">Build Errors</h1>
           <p className="text-foreground/40 text-sm font-medium tracking-tight">Technical support tickets and system bug reports from the community.</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setFilter('open')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'open' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-foreground/5 text-foreground/40'}`}>Triage Required</button>
           <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-foreground/10 text-foreground' : 'bg-foreground/5 text-foreground/40'}`}>All Archive</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
             <div className="p-20 flex justify-center"><div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" /></div>
        ) : issues.length > 0 ? (
          issues.map((issue, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              key={issue.id}
              className="bg-card border border-border rounded-3xl p-8 hover:border-border transition-all group flex flex-col md:flex-row gap-8"
            >
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg bg-orange-500/10 text-orange-500`}>
                        <Bug size={16} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Bug Report</span>
                     <span className="text-[10px] font-mono text-foreground/40 uppercase flex items-center gap-1.5"><Clock size={10} /> {new Date(issue.created_at).toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                     <h3 className="text-xl font-black tracking-tight text-foreground">{issue.title || 'Untitled Issue'}</h3>
                     <p className="text-sm text-foreground/40 leading-relaxed font-medium">{issue.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 uppercase">
                        <User size={12} className="text-blue-500" />
                        <span className="text-foreground">@{issue.users?.username || 'anonymous'}</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 uppercase">
                        <AlertCircle size={12} className="text-foreground/40" />
                        <span>Platform: Desktop/Web</span>
                     </div>
                  </div>
               </div>

               <div className="md:w-48 flex flex-col gap-2 shrink-0 self-center">
                  {issue.status === 'open' ? (
                    <button 
                      onClick={() => resolveIssue(issue.id)}
                      className="w-full py-4 bg-orange-500 text-black rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/10 hover:bg-orange-400 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Mark Resolved
                    </button>
                  ) : (
                    <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl text-center">
                       <CheckCircle2 size={16} className="mx-auto text-green-500 mb-2" />
                       <p className="text-[9px] font-black uppercase tracking-widest text-green-500">Fixed & Verified</p>
                    </div>
                  )}
                  <button className="w-full py-4 bg-foreground/5 border border-border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:bg-foreground/10 hover:text-foreground transition-all flex items-center justify-center gap-2">
                    <MessageSquare size={14} /> Respond
                  </button>
               </div>
            </motion.div>
          ))
        ) : (
          <div className="p-20 text-center opacity-30">
             <Bug size={48} className="mx-auto mb-4" />
             <p className="font-black uppercase tracking-widest">System Stable. No open issues.</p>
          </div>
        )}
      </div>
    </div>
  )
}
