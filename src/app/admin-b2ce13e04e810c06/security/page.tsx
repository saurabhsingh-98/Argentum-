"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ShieldAlert, 
  MapPin, 
  Globe, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Activity,
  Filter,
  RefreshCcw,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SecurityDashboard() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    total: 0,
    critical: 0,
    resolved: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchAlerts = async () => {
    setLoading(true)
    let query = supabase.from('security_alerts').select('*, users(username, display_name)')
    
    if (filter === 'unresolved') query = query.eq('resolved', false)
    if (filter === 'resolved') query = query.eq('resolved', true)
    
    const { data } = await query.order('created_at', { ascending: false })
    setAlerts(data || [])

    // Fetch stats
    const { count: total } = await supabase.from('security_alerts').select('*', { count: 'exact', head: true })
    const { count: critical } = await supabase.from('security_alerts').select('*', { count: 'exact', head: true }).eq('resolved', false)
    const { count: resolved } = await supabase.from('security_alerts').select('*', { count: 'exact', head: true }).eq('resolved', true)

    setStats({ total, critical, resolved })
    setLoading(false)
  }

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const resolveAlert = async (id: string) => {
    await supabase.from('security_alerts').update({ resolved: true }).eq('id', id)
    fetchAlerts()
  }

  const getAlertColor = (type: string) => {
    switch(type) {
      case 'brute_force':
      case 'unauthorized_access': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'suspicious_ip': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'multiple_failures': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-4xl font-black tracking-tighter mb-2 flex items-center gap-3">
             <ShieldAlert className="text-red-500" size={32} /> Intrusion Detection
           </h1>
           <p className="text-foreground/40 text-sm font-medium tracking-tight">Monitoring real-time threats and suspicious network activity.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setFilter('unresolved')}
             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'unresolved' ? 'bg-red-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
           >
             Unresolved
           </button>
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-foreground/10 text-foreground' : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'}`}
           >
             All Logs
           </button>
           <button onClick={fetchAlerts} className="p-2 rounded-xl bg-foreground/5 text-foreground/40 hover:text-foreground transition-all">
             <RefreshCcw size={16} />
           </button>
        </div>
      </header>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Threats', value: stats.critical, icon: ShieldAlert, color: 'text-red-500' },
          { label: 'Resolved Incidents', value: stats.resolved, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Total Events', value: stats.total, icon: Activity, color: 'text-blue-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-3xl p-6 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">{stat.label}</p>
               <p className="text-3xl font-black text-foreground">{stat.value || 0}</p>
            </div>
            <div className={`p-4 rounded-2xl bg-foreground/5 ${stat.color}`}>
               <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Table-style List */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border flex items-center justify-between bg-foreground/[0.02]">
           <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
             <Filter size={14} className="text-foreground/40" /> Security Event Stream
           </h3>
           <span className="text-[10px] font-mono text-foreground/20">Updated in real-time</span>
        </div>

        <div className="flex flex-col">
          {loading ? (
             <div className="p-20 flex justify-center">
               <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
             </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={alert.id} 
                className={`p-6 border-b border-white/5 hover:bg-white/[0.02] transition-all group flex flex-col md:flex-row md:items-center gap-6 ${alert.resolved ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 space-y-3">
                   <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${getAlertColor(alert.type)}`}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                   </div>
                   
                   <h4 className="text-sm font-bold text-foreground leading-snug">
                     {alert.details?.message || 'Unauthorized access attempt detected'}
                   </h4>

                   <div className="flex flex-wrap gap-4 text-[10px] font-medium text-foreground/40 uppercase tracking-tight">
                      <div className="flex items-center gap-1.5">
                        <Globe size={12} className="text-blue-500" />
                        <span className="text-foreground font-mono">{alert.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-orange-500" />
                        <span>{alert.details?.region || alert.details?.geo?.city || 'Unknown Location'}</span>
                      </div>
                      {alert.users && (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-purple-500" />
                          <span className="text-purple-500">@{alert.users.username}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Server size={12} className="text-foreground/40" />
                        <span className="truncate max-w-[200px]">{alert.details?.path || '/'}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                   <button 
                     onClick={() => {
                       window.open(`https://www.abuseipdb.com/check/${alert.ip_address}`, '_blank')
                     }}
                     className="p-3 rounded-xl bg-foreground/5 border border-border text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                   >
                     <ExternalLink size={14} /> Check IP
                   </button>
                   {!alert.resolved && (
                     <button 
                       onClick={() => resolveAlert(alert.id)}
                       className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                     >
                       <CheckCircle2 size={14} /> Resolve Alert
                     </button>
                   )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 mb-6">
                <ShieldCheck size={32} />
              </div>
              <h4 className="text-lg font-bold mb-2 uppercase tracking-tighter text-foreground">Security Ledger Clean</h4>
              <p className="text-sm text-foreground/40 max-w-xs leading-relaxed">No intrusion attempts or suspicious activity detected in the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
