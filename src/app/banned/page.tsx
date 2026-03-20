"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hammer, LogOut, Mail, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function BannedPage() {
  const supabase = createClient() as any
  const router = useRouter()
  const [banDetails, setBanDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('is_banned, ban_reason, banned_until')
        .eq('id', user.id)
        .single()

      // @ts-ignore
      if (!profile?.is_banned) {
        router.push('/')
        return
      }

      setBanDetails(profile)
      setLoading(false)
    }

    fetchBanDetails()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-red-500/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-900/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-[#0a0a0a] border border-red-500/20 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 relative">
              <Hammer className="text-red-500" size={36} />
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
            </div>

            <h1 className="text-3xl font-black tracking-tighter mb-4 text-white">
              Account Suspended
            </h1>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium">
              Your access to the Argentum network has been restricted due to a violation of our terms of service.
            </p>

            <div className="w-full space-y-4 mb-10">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-2">Reason for Ban</span>
                <p className="text-sm text-gray-300 font-medium">
                  {banDetails?.ban_reason || "No specific reason provided."}
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-left flex items-center justify-between">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Status</span>
                   <p className="text-sm text-white font-bold">
                     {banDetails?.banned_until ? `Suspended until ${new Date(banDetails.banned_until).toLocaleDateString()}` : "Permanently Banned"}
                   </p>
                </div>
                <Clock size={18} className="text-gray-600" />
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <a 
                href={`mailto:support@argentum.build?subject=Appeal Ban: ${banDetails?.id || 'User'}`}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Appeal this ban
              </a>
              
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">
          Argentum Security Protocol
        </p>
      </motion.div>
    </div>
  )
}
