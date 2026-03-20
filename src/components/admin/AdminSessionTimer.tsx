"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Timer, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

const SESSION_TIMEOUT = 15 * 60; // 15 minutes in seconds

export default function AdminSessionTimer() {
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT)
  const [isExpiring, setIsExpiring] = useState(false)
  const router = useRouter()
  const supabase = createClient() as any

  const handleLogout = useCallback(async (reason: string) => {
    await supabase.auth.signOut()
    router.push(`/auth/login?message=${encodeURIComponent(reason)}`)
  }, [router, supabase])

  const extendSession = useCallback(async () => {
    // Ping to refresh the middleware cookie
    try {
      await fetch('/api/admin/csrf')
      setTimeLeft(SESSION_TIMEOUT)
      setIsExpiring(false)
    } catch (e) {
      console.error('Failed to extend session')
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleLogout('Admin session expired')
          return 0
        }
        
        const newTime = prev - 1
        if (newTime <= 120 && !isExpiring) {
          setIsExpiring(true)
        }
        
        // Auto-extend at 30 seconds if any activity detected (simplified)
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [handleLogout, isExpiring])

  // Reset timer on user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const resetTimer = () => {
      if (timeLeft < SESSION_TIMEOUT - 60) { // Throttle pings
        extendSession()
      }
    }

    events.forEach(event => window.addEventListener(event, resetTimer))
    return () => events.forEach(event => window.removeEventListener(event, resetTimer))
  }, [extendSession, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="px-4 py-3 bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className={isExpiring ? 'text-red-500' : 'text-green-500'} />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Secure Session</span>
        </div>
        <div className={`flex items-center gap-1 font-mono text-[10px] font-bold ${isExpiring ? 'text-red-500' : 'text-foreground'}`}>
          <Timer size={10} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden mb-3">
        <motion.div 
          initial={false}
          animate={{ width: `${(timeLeft / SESSION_TIMEOUT) * 100}%` }}
          className={`h-full ${isExpiring ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-green-500'}`}
        />
      </div>

      <AnimatePresence>
        {isExpiring && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-red-500 animate-pulse">
               <AlertTriangle size={10} />
               <span className="text-[9px] font-black uppercase tracking-tight">Session expiring soon</span>
            </div>
            <button 
              onClick={extendSession}
              className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all border border-red-500/20"
            >
              <RefreshCw size={10} /> Extend Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
