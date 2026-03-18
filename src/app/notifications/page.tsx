"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Bell, 
  ArrowUp, 
  MessageCircle, 
  UserPlus, 
  Lock, 
  CheckCircle, 
  Loader2, 
  Trash2, 
  CheckCheck,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotificationsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      await fetchNotifications(user.id)
    }

    checkAuth()
  }, [])

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user:users!notifications_from_user_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string, link?: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )

      if (link) router.push(link)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'upvote': return <ArrowUp size={16} className="text-green-500" />
      case 'comment': return <MessageCircle size={16} className="text-blue-500" />
      case 'follow': return <UserPlus size={16} className="text-foreground/40" />
      case 'message': return <Lock size={16} className="text-green-500" />
      case 'verified': return <CheckCircle size={16} className="text-green-500" />
      default: return <Bell size={16} className="text-foreground/40" />
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const groupNotifications = (notifs: any[]) => {
    const groups: any = {
      Today: [],
      Yesterday: [],
      Older: []
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    notifs.forEach(n => {
      const date = new Date(n.created_at)
      if (date.toDateString() === today.toDateString()) {
        groups.Today.push(n)
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(n)
      } else {
        groups.Older.push(n)
      }
    })

    return groups
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-foreground/40 animate-spin" />
      </div>
    )
  }

  const grouped = groupNotifications(notifications)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-silver/30 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col gap-8"
        >
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <Bell size={24} />
              </div>
              <div className="flex flex-col">
                 <h1 className="text-3xl font-black text-foreground tracking-tighter">Notifications</h1>
                 <p className="text-foreground/40 text-xs font-bold uppercase tracking-widest">Your activity feed</p>
              </div>
            </div>
            {notifications.some(n => !n.is_read) && (
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-foreground/10 transition-all"
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
             <div className="glass-card p-20 flex flex-col items-center text-center gap-6 mt-10">
              <div className="w-20 h-20 rounded-[2rem] border border-border bg-card flex items-center justify-center text-foreground/40">
                <span className="text-xl font-black uppercase tracking-widest opacity-20">Ag</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-black text-foreground">No notifications yet</h2>
                <p className="text-foreground/40 text-sm">Activities from users you interact with will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {Object.entries(grouped).map(([title, items]: [string, any]) => (
                items.length > 0 && (
                  <div key={title} className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">{title}</span>
                       <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((n: any) => (
                        <div 
                          key={n.id}
                          onClick={() => markAsRead(n.id, n.link)}
                          className={`glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-foreground/5 transition-all group relative overflow-hidden ${
                            !n.is_read ? 'bg-foreground/[0.02] border-l-2 border-l-green-500' : 'opacity-60 grayscale-[0.5]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full border border-border bg-card overflow-hidden flex items-center justify-center text-foreground relative z-10">
                            {n.from_user.avatar_url ? (
                              <img src={n.from_user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black">
                                {n.from_user.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || n.from_user.username?.[0].toUpperCase()}
                              </span>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center shadow-xl">
                              {getIcon(n.type)}
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col gap-0.5 relative z-10">
                            <p className="text-sm font-medium text-foreground/60 leading-tight">
                              <span className="text-foreground font-bold">{n.from_user.display_name || `@${n.from_user.username}`}</span> {n.content.split(n.from_user.display_name || n.from_user.username).pop()}
                            </p>
                            <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                              {formatRelativeTime(n.created_at)}
                            </span>
                          </div>

                          {!n.is_read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
