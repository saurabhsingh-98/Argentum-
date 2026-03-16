"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, AtSign, FileText, Rocket, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Onboarding() {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [currentlyBuilding, setCurrentlyBuilding] = useState('')
  const [user, setUser] = useState<any>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameMessage, setUsernameMessage] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user already has a username
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        router.push('/')
        return
      }

      setUser(user)
      
      // Auto-fill from GitHub/Google if available
      setDisplayName(user.user_metadata.full_name || user.user_metadata.name || '')
      const rawUsername = user.user_metadata.user_name || user.user_metadata.preferred_username || ''
      if (rawUsername) {
        setUsername(rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, ''))
      }
    }
    checkUser()
  }, [supabase, router])

  // Real-time username check
  useEffect(() => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanUsername !== username) {
      setUsername(cleanUsername)
    }

    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      setUsernameMessage('')
      return
    }

    if (username.length > 20) {
      setUsernameStatus('taken')
      setUsernameMessage('Username too long (max 20)')
      return
    }

    const checkAvailability = async () => {
      setUsernameStatus('checking')
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

      if (error && error.code === 'PGRST116') { // Not found -> Available
        setUsernameStatus('available')
        setUsernameMessage('Username available')
      } else {
        setUsernameStatus('taken')
        setUsernameMessage('Username already taken')
      }
    }

    const timer = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timer)
  }, [username, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading || usernameStatus !== 'available') return

    setLoading(true)
    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: displayName,
        bio,
        currently_building: currentlyBuilding,
        avatar_url: user.user_metadata.avatar_url,
        github_username: user.user_metadata.user_name,
        email: user.email
      })

      if (error) throw error
      
      router.push(`/profile/${username}`)
      router.refresh()
    } catch (error: any) {
      console.error('Onboarding error:', error.message)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-silver/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-10 md:p-12 border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-2xl border-2 border-silver/20 flex items-center justify-center bg-[#0d0d0d] mb-6 shadow-glow"
            >
              <span className="text-xl font-black text-silver-glow-text tracking-tighter">Ag</span>
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight text-center">Initialize Identity</h1>
            <p className="text-gray-500 text-sm mt-3 text-center font-medium max-w-xs">
              Every builder needs a name. Claim yours on the Argentum protocol.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* Username Field */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Username</label>
              <div className="relative group">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-silver transition-colors" size={16} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  maxLength={20}
                  className={`w-full bg-white/[0.03] border rounded-2xl pl-12 pr-12 py-4 text-sm text-white focus:outline-none transition-all ${
                    usernameStatus === 'available' ? 'border-green-500/30 focus:border-green-500' : 
                    usernameStatus === 'taken' ? 'border-red-500/30 focus:border-red-500' : 
                    'border-white/5 focus:border-silver/40'
                  }`}
                  placeholder="builder_01"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {usernameStatus === 'checking' && (
                      <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="animate-spin text-gray-600" size={18} />
                      </motion.div>
                    )}
                    {usernameStatus === 'available' && (
                      <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <CheckCircle2 className="text-green-500" size={18} />
                      </motion.div>
                    )}
                    {usernameStatus === 'taken' && (
                      <motion.div key="error" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <AlertCircle className="text-red-500" size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {usernameMessage && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}
                >
                  {usernameMessage}
                </motion.span>
              )}
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Display Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-silver transition-colors" size={16} />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Building <span className="text-gray-700">(Optional)</span></label>
                <div className="relative group">
                  <Rocket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-silver transition-colors" size={16} />
                  <input
                    type="text"
                    value={currentlyBuilding}
                    onChange={(e) => setCurrentlyBuilding(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                    placeholder="Argentum..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Bio <span className="text-gray-700">(Optional)</span></label>
              <div className="relative group">
                <FileText className="absolute left-4 top-5 text-gray-600 group-focus-within:text-silver transition-colors" size={16} />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all min-h-[100px] resize-none"
                  placeholder="Shipping daily..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || usernameStatus !== 'available'}
              className={`
                w-full group relative flex items-center justify-center gap-3 font-black py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:grayscale
                ${usernameStatus === 'available' ? 'silver-metallic shadow-glow' : 'bg-white/5 text-gray-500 border border-white/5'}
              `}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase tracking-[0.4em] text-xs">Complete Onboarding</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
