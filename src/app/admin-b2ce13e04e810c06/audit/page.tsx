"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Target, 
  Activity, 
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Database,
  Terminal
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuditLogView() {
  const supabase = createClient()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    let query = supabase.from('admin_audit_log').select('*, users(username, display_name)', { count: 'exact' })
    
    if (search) {
      query = query.or(`action.ilike.%${search}%,target_type.ilike.%${search}%`)
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1)

    setLogs(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(), 300)
    return () => clearTimeout(timer)
  }, [search, page])

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (action.includes('ban')) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    if (action.includes('verify')) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (action.includes('admin')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-gray-400 bg-white/5 border-white/10';
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tighter mb-2">Audit Ledger</h1>
           <p className="text-gray-500 text-sm font-medium tracking-tight">Immutable history of administrative actions and system modifications.</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Terminal size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-red-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filter by action or target..."
            className="pl-12 pr-6 py-3 bg-card border border-border rounded-2xl w-full text-xs font-bold outline-none border-red-500/0 focus:border-red-500/30 transition-all text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border text-[10px] font-black uppercase tracking-widest text-foreground/40">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-6 py-5">Administrator</th>
                <th className="px-6 py-5">Action</th>
                <th className="px-6 py-5">Target</th>
                <th className="px-8 py-5 text-right">Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-foreground">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-[10px] font-mono text-foreground/40 uppercase">{new Date(log.created_at).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-foreground uppercase tracking-tight">@{log.users?.username || 'system'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                       {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">{log.target_type}:</span>
                        <span className="text-[10px] font-mono text-foreground/40 truncate max-w-[150px]">{log.target_id}</span>
                     </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[9px] font-mono text-foreground/60 bg-foreground/5 px-2 py-1 rounded">{log.ip_address || 'internal'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !loading && (
            <div className="p-20 text-center opacity-30">
               <Database size={48} className="mx-auto mb-4" />
               <p className="font-black uppercase tracking-widest">No audit entries found</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex items-center justify-between text-xs font-bold text-foreground/40">
           <span>{totalCount} immutable records</span>
           <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-border rounded-xl disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={page * 20 >= totalCount} onClick={() => setPage(p => p + 1)} className="p-2 border border-border rounded-xl disabled:opacity-30"><ChevronRight size={16} /></button>
           </div>
        </div>
      </div>
    </div>
  )
}
