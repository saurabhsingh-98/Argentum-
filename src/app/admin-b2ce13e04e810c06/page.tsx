"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  FileText, 
  Flag, 
  Bug, 
  CheckCircle2, 
  MessageSquare,
  TrendingUp,
  History,
  UserPlus,
  AlertCircle,
  ShieldAlert
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from 'recharts'

const ADMIN_SEGMENT = 'b2ce13e04e810c06';

export default function AdminOverview() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalPosts: 0,
    openReports: 0,
    openIssues: 0,
    verifiedPosts: 0,
    statusUpdatesToday: 0
  })
  const [charts, setCharts] = useState<any>({
    userGrowth: [],
    postActivity: []
  })
  const [activity, setActivity] = useState<any>({
    auditLogs: [],
    newUsers: [],
    securityAlerts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 1. Stats
      const [
        { count: userCount },
        { count: postCount },
        { count: reportCount },
        { count: issueCount },
        { count: verifiedCount },
        { count: statusCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('issue_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('status_updates').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      setStats({
        totalUsers: userCount || 0,
        totalPosts: postCount || 0,
        openReports: reportCount || 0,
        openIssues: issueCount || 0,
        verifiedPosts: verifiedCount || 0,
        statusUpdatesToday: statusCount || 0
      })

      // 2. Charts (Growth simulation)
      setCharts({
        userGrowth: [
          { name: 'Week 1', users: 12 },
          { name: 'Week 2', users: 24 },
          { name: 'Week 3', users: 45 },
          { name: 'Week 4', users: userCount || 60 },
        ],
        postActivity: [
          { name: 'Mon', posts: 4 },
          { name: 'Tue', posts: 7 },
          { name: 'Wed', posts: 5 },
          { name: 'Thu', posts: 9 },
          { name: 'Fri', posts: 12 },
          { name: 'Sat', posts: 8 },
          { name: 'Sun', posts: 6 },
        ]
      })

      // 3. Activity
      const [
        { data: logs },
        { data: users },
        { data: alerts }
      ] = await Promise.all([
        supabase.from('admin_audit_log').select('*, users(username, avatar_url)').order('created_at', { ascending: false }).limit(6),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('security_alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(6)
      ])

      setActivity({
        auditLogs: logs || [],
        newUsers: users || [],
        securityAlerts: alerts || []
      })

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
      </div>
      <div className="h-96 bg-white/5 rounded-3xl" />
    </div>
  }

  return (
    <div className="space-y-10 selection:bg-red-500/30">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-foreground">Systems Overview</h1>
          <p className="text-foreground/40 text-sm font-medium tracking-tight">Real-time platform intelligence and control center.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-green-500">System Healthy</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Open Reports', value: stats.openReports, icon: Flag, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Open Issues', value: stats.openIssues, icon: Bug, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Verified Logs', value: stats.verifiedPosts, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Status Updates', value: stats.statusUpdatesToday, icon: MessageSquare, color: 'text-foreground/40', bg: 'bg-foreground/5' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={stat.label}
            className="bg-card border border-border rounded-[2.2rem] p-6 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon size={20} />
              </div>
              <TrendingUp size={16} className="text-foreground/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">{stat.label}</span>
              <span className="text-3xl font-black text-foreground">{stat.value.toLocaleString()}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> Growth & Activity
              </h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">Users</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-[10px] font-bold text-foreground/40 uppercase">Posts</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }} />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Security Alerts List */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex flex-col overflow-hidden">
           <div className="p-8 border-b border-red-500/10 bg-red-500/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-red-500">
                <ShieldAlert size={14} /> Critical Alerts
              </h3>
              {activity.securityAlerts.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-black text-[9px] font-black rounded-lg animate-pulse">
                  {activity.securityAlerts.length} NEW
                </span>
              )}
           </div>
           <div className="flex-1 overflow-y-auto max-h-[400px]">
              {activity.securityAlerts.length > 0 ? (
                <div className="divide-y divide-red-500/10">
                  {activity.securityAlerts.map((alert: any) => (
                    <div key={alert.id} className="p-5 hover:bg-red-500/5 transition-colors group">
                       <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">{alert.type.replace(/_/g, ' ')}</p>
                       <p className="text-xs font-bold text-foreground mb-2">{alert.details?.message || 'Suspicious activity detected'}</p>
                       <div className="flex items-center justify-between text-[9px] font-mono text-foreground/40">
                          <span>IP: {alert.ip_address}</span>
                          <button className="text-red-500/60 hover:text-red-400 transition-colors uppercase font-black">Resolve</button>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 text-center">
                   <CheckCircle2 size={32} className="text-green-500 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-relaxed">System is secure.<br/>No active threats.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Bottom Grid: Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        {/* Audit Log */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground/40">
              <History size={14} className="text-red-500" /> Admin Audit Trail
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors">View All Tracker →</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activity.auditLogs.map((log: any) => (
              <div key={log.id} className="p-5 flex items-center gap-4 hover:bg-foreground/[0.02] transition-colors border-b border-border last:border-0">
                <div className="w-10 h-10 rounded-2xl border border-border overflow-hidden bg-foreground/5 flex items-center justify-center text-xs font-black text-red-500">
                    {log.users?.avatar_url ? <img src={log.users.avatar_url} className="w-full h-full object-cover" /> : log.users?.username?.[0].toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">
                    <span className="text-red-400">@{log.users?.username || 'admin'}</span> {log.action}
                  </p>
                  <p className="text-[10px] text-foreground/40 font-medium">Target: {log.target_type} • {new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="px-2 py-1 bg-foreground/5 rounded-lg border border-border text-[8px] font-mono text-foreground/20">
                  {log.ip_address || 'internal'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Signups */}
        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-border">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground/40">
              <UserPlus size={14} className="text-blue-500" /> New Builders
            </h3>
          </div>
          <div className="flex-1 p-6 space-y-6">
             {activity.newUsers.map((builder: any) => (
              <div key={builder.id} className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl border border-border overflow-hidden bg-foreground/5 flex items-center justify-center text-xs font-black text-blue-500">
                    {builder.avatar_url ? <img src={builder.avatar_url} className="w-full h-full object-cover" /> : builder.username[0].toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{builder.display_name || builder.username}</p>
                    <p className="text-[10px] text-foreground/40 font-mono">@{builder.username}</p>
                 </div>
                 <span className="text-[9px] font-bold text-foreground/20 uppercase">
                   {new Date(builder.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                 </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
