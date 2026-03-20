"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, User, LogOut, Loader2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SavedAccount {
  id: string
  email: string // Keep email for fallback login
  username: string
  avatar_url: string | null
  display_name: string | null
  session?: any // Add session property
}

export default function AccountSwitcher({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const supabase = createClient() as any
  const router = useRouter()
  const [accounts, setAccounts] = useState<SavedAccount[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('saved_accounts')
    if (saved) {
      setAccounts(JSON.parse(saved))
    }
  }, [isOpen])

  const switchAccount = async (account: any) => {
    setLoading(account.id)
    try {
      if (account.session?.access_token && account.session?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: account.session.access_token,
          refresh_token: account.session.refresh_token
        })
        if (error) throw error
        onClose()
        router.refresh()
      } else {
        // Fallback if session is missing
        await supabase.auth.signOut()
        router.push(`/auth/login?email=${account.email}`)
      }
    } catch (err: any) {
      console.error('Failed to switch account:', err)
      alert("Session expired. Please log in again.")
      await supabase.auth.signOut()
      router.push(`/auth/login?email=${account.email}`)
    } finally {
      setLoading(null)
    }
  }

  const removeAccount = (id: string) => {
    const newAccounts = accounts.filter(a => a.id !== id)
    setAccounts(newAccounts)
    localStorage.setItem('saved_accounts', JSON.stringify(newAccounts))
  }

  const addAccount = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] p-8 shadow-4xl overflow-hidden"
      >
        <div className="noise-bg absolute inset-0 pointer-events-none opacity-[0.03]" />
        
        <div className="flex justify-between items-center mb-8 relative">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-foreground">Switch Account</h2>
            <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest mt-1">Manage your identities</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-all text-foreground/40 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 relative">
          {accounts.map((acc) => (
            <div 
              key={acc.id}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-border hover:bg-foreground/10 transition-all cursor-pointer"
              onClick={() => switchAccount(acc)}
            >
              <div className="w-12 h-12 rounded-xl border border-border overflow-hidden bg-background flex items-center justify-center text-foreground font-black">
                {acc.avatar_url ? <img src={acc.avatar_url} className="w-full h-full object-cover" alt={acc.username} /> : (acc.display_name || acc.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-foreground">{acc.display_name || acc.username}</p>
                <p className="text-[10px] text-foreground/40 font-mono tracking-tight font-bold">@{acc.username}</p>
              </div>
              
              {loading === acc.id ? (
                <Loader2 size={16} className="animate-spin text-silver" />
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all text-foreground/20 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          <button 
            onClick={addAccount}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-dashed border-border hover:border-foreground/30 hover:bg-foreground/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground/40 group-hover:text-foreground transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-foreground/40 group-hover:text-foreground">Add another account</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center relative">
          <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-[0.2em]">Argentum Multi-Account Sync</p>
        </div>
      </motion.div>
    </div>
  )
}
