"use client"

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Github, Plus, LogIn, ChevronDown, Search, Loader2, MessageCircle } from 'lucide-react'

export default function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Fetch profile to get the correct username
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setProfileUsername(profile.username)
        }

        // Check for conversations (any conversation counts as unread for now as requested)
        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        
        if (count && count > 0) {
          setUnreadMessages(true)
        }
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUser() // Re-fetch profile on auth change
      } else {
        setProfileUsername(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  /* Removed handleSignIn dropdown logic as we redirect to /auth/login now */

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
            {[
              { name: 'Feed', href: '/feed' },
              { name: 'Explore', href: '/explore' }
            ].map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="text-[11px] text-gray-500 hover:text-white transition-all duration-300 uppercase font-bold relative group/link"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-silver transition-all duration-300 group-hover/link:w-full" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onSearchClick}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/40 transition-all active:scale-95 group/search"
          >
            <Search size={16} className="group-hover/search:text-silver transition-colors" />
          </button>

          {user && (
            <Link 
              href="/messages"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/40 transition-all active:scale-95 group/messages relative"
            >
              <MessageCircle size={16} className="group-hover/messages:text-silver transition-colors" />
              {unreadMessages && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-green-500 rounded-full border-2 border-[#050505] animate-pulse" />
              )}
            </Link>
          )}

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

              <Link 
                href={profileUsername ? `/profile/${profileUsername}` : user?.user_metadata?.username ? `/profile/${user.user_metadata.username}` : user ? '/onboarding' : '#'} 
                className={`group relative ${!profileUsername && !user?.user_metadata?.username && user ? 'cursor-wait' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-[#0d0d0d] flex items-center justify-center text-xs font-bold text-silver group-hover:border-white/40 group-hover:silver-glow transition-all duration-500">
                  {!profileUsername && user ? (
                    <Loader2 size={16} className="animate-spin text-silver/40" />
                  ) : user.user_metadata.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.email?.[0].toUpperCase()
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <div className="relative">
              <Link 
                href="/auth/login"
                className="flex items-center gap-2 bg-white/5 border border-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all active:scale-95 hover:border-white/40"
              >
                <LogIn size={14} className="text-silver" />
                <span>Sign In</span>
              </Link>

              {/* Auth modal dropdown removed in favor of dedicated page */}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
