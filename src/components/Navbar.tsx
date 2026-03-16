"use client"

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Github, Plus, LogIn, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignIn = (provider: 'github' | 'google') => {
    if (!supabase) return
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl border border-silver/40 flex items-center justify-center bg-[#0d0d0d] group-hover:silver-glow transition-all duration-500 group-hover:rotate-[10deg]">
              <span className="text-sm font-bold text-silver selection:bg-transparent">Ag</span>
            </div>
            <div className="flex flex-col overflow-hidden">
               <span className="text-[10px] font-bold tracking-[0.4em] text-silver uppercase hidden sm:block selection:bg-transparent group-hover:translate-y-[-100%] transition-transform duration-500">
                ARGENTUM
              </span>
              <span className="text-[10px] font-bold tracking-[0.4em] text-white uppercase hidden sm:block selection:bg-transparent translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500 absolute">
                ARGENTUM
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 font-mono tracking-tighter">
            {['Feed', 'Explore', 'Challenges'].map((item) => (
              <Link 
                key={item} 
                href={item === 'Feed' ? '/' : `/${item.toLowerCase()}`} 
                className="text-[11px] text-gray-500 hover:text-white transition-all duration-300 uppercase font-bold relative group/link"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-silver transition-all duration-300 group-hover/link:w-full" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-5">
              <Link 
                href="/new" 
                className="silver-metallic flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-glow hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              >
                <Plus size={14} />
                <span>Build Log</span>
              </Link>

              {/* Build Streak UI */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 group/streak hover:border-orange-500/50 transition-all cursor-default">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                  <svg className="w-4 h-4 text-orange-500 relative z-10 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.9 2.5C11.5 1.5 9.8 1.4 8.6 2.1c-2.3 1.3-3.1 4.5-1.5 7 .2.4.5.7.8 1.1-.9 2.1-1.1 4.3-.4 6.3 1.1 3.2 4.1 5.5 7.6 5.5s6.5-2.3 7.6-5.5c.7-2 .5-4.2-.4-6.3 1.6-2.5.8-5.7-1.5-7-1.2-.7-2.9-.6-4.3.4" />
                  </svg>
                </div>
                <div className="flex flex-col -space-y-1">
                  <span className="text-[10px] font-black text-white group-hover:text-orange-500 transition-colors">
                    {user.user_metadata.streak_count || 1}
                  </span>
                  <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Streak</span>
                </div>
              </div>

              <Link href={`/profile/${user.user_metadata.user_name || user.id}`} className="group relative">
                <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-[#0d0d0d] flex items-center justify-center text-xs font-bold text-silver group-hover:border-white/40 group-hover:silver-glow transition-all duration-500">
                  {user.user_metadata.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.email?.[0].toUpperCase()
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowAuthModal(!showAuthModal)}
                className="flex items-center gap-2 bg-white/5 border border-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all active:scale-95 hover:border-white/40"
              >
                <LogIn size={14} className="text-silver" />
                <span>Sign In</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${showAuthModal ? 'rotate-180' : ''}`} />
              </button>

              {showAuthModal && (
                <div className="absolute top-14 right-0 w-48 glass-card border-white/10 p-2 flex flex-col gap-1 shadow-2xl animate-fade-in z-50">
                  <button 
                    onClick={() => handleSignIn('github')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors text-left group/btn"
                  >
                    <Github size={14} className="group-hover/btn:text-silver transition-colors" />
                    <span>via GitHub</span>
                  </button>
                  <button 
                    onClick={() => handleSignIn('google')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors text-left group/btn"
                  >
                    <svg className="w-3.5 h-3.5 group-hover/btn:text-silver transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.91 3.23-2.02 4.35-1.11 1.11-2.83 2.15-5.82 2.15-4.67 0-8.52-3.8-8.52-8.5s3.85-8.5 8.52-8.5c2.56 0 4.41.91 5.8 2.3l2.3-2.3C18.41 1.54 15.68 0 12.48 0 6.94 0 2.45 4.5 2.45 10s4.49 10 10.03 10c3.02 0 5.3-.99 7.03-2.73 1.77-1.78 2.33-4.3 2.33-6.33 0-.6-.05-1.18-.15-1.72h-9.2z"/></svg>
                    <span>via Google</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
