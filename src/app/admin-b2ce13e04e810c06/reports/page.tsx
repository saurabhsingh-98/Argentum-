"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Flag, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useCsrfToken } from '@/hooks/useCsrfToken'

const severityStyles: Record<string, string> = {
  low: 'bg-green-500/10 border-green-500/20 text-green-500',
  medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
  high: 'bg-red-500/10 border-red-500/20 text-red-500',
}

export default function ReportsQueue() {
  const supabase = createClient() as any
  const { token: csrfToken } = useCsrfToken()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const fetchReports = async () => {
    setLoading(true)
    let query = supabase.from('reports').select(`
      *,
      reporter:users!reports_reporter_id_fkey(username, display_name),
      target_user:users!reports_target_user_id_fkey(username, display_name)
    `)
    
    if (filter !== 'all') query = query.eq('status', filter)
    
    const { data } = await query.order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [filter])

  const resolveReport = async (id: string, resolution: string) => {
    if (!csrfToken) return alert('CSRF missing.')
    const { data: { user } } = await supabase.auth.getUser()

    // @ts-ignore
    await supabase.from('reports').update({ 
      status: 'resolved', 
      resolution: resolution,
      resolved_at: new Date().toISOString()
    }).eq('id', id)

    // @ts-ignore
    await supabase.from('admin_audit_log').insert({
      admin_id: user?.id,
      action: 'resolve_report',
      target_type: 'report',
      target_id: id
    })

    fetchReports()
  }

  return (
    <div className="space-y-8">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground">Sanitation Queue</h1>
           <p className="text-foreground/40 text-sm font-medium tracking-tight">Review and resolve user-submitted violation reports.</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'bg-foreground/5 text-foreground/40'}`}>Pending</button>
           <button onClick={() => setFilter('resolved')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-foreground/5 text-foreground/40'}`}>Resolved</button>
           <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-foreground/10 text-foreground' : 'bg-foreground/5 text-foreground/40'}`}>History</button>
           <button onClick={fetchReports} className="p-2 bg-foreground/5 rounded-xl text-foreground/40 hover:text-foreground transition-all"><RefreshCcw size={16} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
             <div className="p-20 flex justify-center"><div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" /></div>
        ) : reports.length > 0 ? (
          reports.map((report, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={report.id}
              className="bg-card border border-border rounded-3xl p-8 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-8">
                 <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                       <span className={`px-2 py-1 border text-[8px] font-black uppercase tracking-widest rounded-lg ${severityStyles[report.severity] || severityStyles.medium}`}>
                         {report.severity || 'medium'} severity
                       </span>
                       <span className="text-[10px] font-mono text-foreground/40 uppercase flex items-center gap-1.5"><Clock size={10} /> {new Date(report.created_at).toLocaleString()}</span>
                    </div>

                    <div className="space-y-1">
                       <div className="flex items-center gap-2 text-xs font-bold text-foreground/40">
                          <User size={12} className="text-red-500" />
                          <span className="text-foreground">@{report.reporter?.username || report.reporter?.display_name || 'unknown'}</span> reported 
                          {report.target_user_id ? (
                            <span className="text-red-400">@{report.target_user?.username || report.target_user?.display_name}</span>
                          ) : (
                            <span className="text-blue-400">Post ID: {report.target_post_id}</span>
                          )}
                       </div>
                       <h3 className="text-lg font-black tracking-tight text-foreground">{report.reason}</h3>
                       <p className="text-sm text-foreground/40 leading-relaxed italic">"{report.details || 'No additional details provided.'}"</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                       {report.target_post_id && (
                         <button 
                           onClick={() => window.open(`/post/${report.target_post_id}`, '_blank')}
                           className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                         >
                           <FileText size={12} /> View Log
                         </button>
                       )}
                       {report.target_user_id && (
                         <button 
                            onClick={() => window.open(`/profile/${report.target_user?.username}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                         >
                           <User size={12} /> View Target
                         </button>
                       )}
                    </div>
                 </div>

                 <div className="md:w-64 flex flex-col gap-2 shrink-0">
                    {report.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => resolveReport(report.id, 'dismissed')}
                          className="w-full py-4 bg-foreground/5 border border-border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:bg-foreground/10 hover:text-foreground transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={14} /> Dismiss
                        </button>
                        <button 
                          onClick={() => resolveReport(report.id, 'taken_action')}
                          className="w-full py-4 bg-red-600 text-black rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                        >
                          <AlertTriangle size={14} /> Action Taken
                        </button>
                      </>
                    ) : (
                      <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl text-center">
                         <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-1">Resolved</p>
                         <p className="text-[10px] text-foreground/40 font-bold uppercase">{report.resolution}</p>
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-20 text-center opacity-30">
             <Flag size={48} className="mx-auto mb-4" />
             <p className="font-black uppercase tracking-widest">Queue Clear. No reports pending.</p>
          </div>
        )}
      </div>
    </div>
  )
}
