"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, ArrowUp, MessageCircle, UserPlus, Lock, CheckCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export default function NotificationBell() {
  const supabase = createClient() as any
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [toast, setToast] = useState<{ id: string; content: string; type: string } | null>(null)

  useEffect(() => {
    let channel: any

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // Initial count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)

      // Subscribe to real-time notifications
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload: { new: Database['public']['Tables']['notifications']['Row'] }) => {
            setUnreadCount(prev => prev + 1)
            
            // Check for mute status if it's a message
            if (payload.new.type === 'message' && payload.new.link) {
              const convId = payload.new.link.split('/').pop()
              const isMuted = localStorage.getItem(`muted_${convId}`) === 'true'
              if (isMuted) return
            }

            showToast(payload.new)
          }
        )
        .subscribe()
    }

    setup()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const showToast = (notification: Database['public']['Tables']['notifications']['Row']) => {
    setToast({
      id: notification.id,
      content: notification.content,
      type: notification.type
    })

    setTimeout(() => {
      setToast(null)
    }, 4000)
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

  return (
    <>
      <Link 
        href="/notifications" 
        className="relative p-2 hover:bg-foreground/5 rounded-xl transition-all group"
      >
        <Bell 
          size={20} 
          className="text-foreground/40 group-hover:text-foreground transition-colors" 
        />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] border border-background" />
        )}
      </Link>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0, x: 20 }}
            animate={{ y: 0, opacity: 1, x: 0 }}
            exit={{ y: 20, opacity: 0, x: 20 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm"
          >
            <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.02] to-transparent pointer-events-none" />
              
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/40">
                {getIcon(toast.type)}
              </div>
              
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">New Notification</span>
                <p className="text-xs font-bold text-foreground leading-tight pr-4">
                  {toast.content}
                </p>
              </div>

              <button 
                onClick={() => setToast(null)}
                className="p-1 hover:bg-foreground/10 rounded-lg transition-colors text-foreground/20 hover:text-foreground"
              >
                <X size={14} />
              </button>

              <div className="absolute bottom-0 left-0 h-0.5 bg-green-500/30 animate-shrink-width" style={{ width: '100%' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
