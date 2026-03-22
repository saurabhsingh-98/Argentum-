"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export default function UpdatesClient() {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [stats, setStats] = useState<{ total: number, verified: number } | null>(null)
  
  const supabase = createClient() as any
  const { token: csrfToken } = useCsrfToken()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: total } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: verified } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('email', 'is', null)
        setStats({ total: total || 0, verified: verified || 0 })
      } catch (e) {
        console.error('Failed to fetch stats:', e)
      }
    }
    fetchStats()
  }, [])

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !content) return
    
    setSending(true)
    setStatus(null)

    try {
      const response = await fetch('/api/admin/broadcast-update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify({ subject, content })
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(json.error || 'Failed to send broadcast')
      }

      setStatus({ type: 'success', message: json.message || 'Update broadcast initiated successfully!' })
      setSubject('')
      setContent('')
    } catch (err: any) {
      console.error('Broadcast error:', err)
      setStatus({ type: 'error', message: err.message || 'Failed to send update' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black mb-2 text-foreground">Platform Updates</h2>
        <p className="text-sm text-foreground/40 font-medium tracking-tight">Broadcast news and updates to all registered builders.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleSendUpdate} className="bg-card border border-border rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Email Subject</label>
            <input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="System Update: New Features for Builders"
              required
              className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-1">Message Body (Supports basic HTML/Markdown)</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the new features or platform announcements..."
              required
              rows={10}
              className="w-full bg-background border border-border rounded-3xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none"
            />
          </div>

          {status && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
                status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{status.message}</span>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={sending}
            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              sending 
                ? 'bg-foreground/5 text-foreground/20 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
            }`}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Broadcasting...' : 'Send Broadcast Email'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
              <Mail size={14} /> Mailing Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-foreground/40">Total Active Users</span>
                <span className="text-foreground">{stats ? stats.total : 'Calculating...'}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-foreground/40">Email Verified Users</span>
                <span className="text-foreground">{stats ? stats.verified : 'Calculating...'}</span>
              </div>
              <div className="h-px bg-blue-500/10 my-2" />
              <div className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">
                Emails are sent via Resend API
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-4">Diagnostics</h3>
            <div className="space-y-4">
              <button 
                onClick={async () => {
                   alert('In a real implementation, this would trigger a push event via Web-Push library to all subscribed user endpoints.')
                }}
                className="w-full py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5 transition-all"
              >
                Send Test Push (Subscribed Devices)
              </button>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-4">Guidelines</h3>
            <ul className="space-y-3">
              {[
                'Broadcasting emails triggers a real-time job.',
                'Ensure the user base is segmented if necessary.',
                'Use clear, non-spammy subject lines.',
                'Include an unsubscribe link (handled automatically).'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs font-medium text-foreground/60">
                  <span className="text-blue-500">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
