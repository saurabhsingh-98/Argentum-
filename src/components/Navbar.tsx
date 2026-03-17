"use client"

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Github, 
  Plus, 
  LogIn, 
  ChevronDown, 
  Search, 
  Loader2, 
  MessageCircle, 
  Bell,
  Settings,
  Users,
  LogOut,
  User as UserIcon,
  CheckCircle
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import AccountSwitcher from './AccountSwitcher'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: prof } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (prof) {
          setProfile(prof)
          // Save to saved_accounts
          const saved = JSON.parse(localStorage.getItem('saved_accounts') || '[]')
          const existingIdx = saved.findIndex((a: any) => a.id === user.id)
          const accInfo = {
            id: user.id,
            email: user.email,
            username: prof.username,
            avatar_url: prof.avatar_url,
            display_name: prof.display_name
          }
          if (existingIdx > -1) saved[existingIdx] = accInfo
          else saved.push(accInfo)
          localStorage.setItem('saved_accounts', JSON.stringify(saved))
        }
      }
    }
    setup()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setup()
      } else {
        setProfile(null)
      }
    })

    const clickOutside = () => setShowDropdown(false)
    window.addEventListener('click', clickOutside)
    return () => {
        subscription.unsubscribe()
        window.removeEventListener('click', clickOutside)
    }
  }, [supabase])

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
            </Link>
          )}

          {user && <NotificationBell />}

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
                    {user.user_metadata.streak_count || profile?.streak_count || 1}
                  </span>
                  <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Streak</span>
                </div>
              </div>

              <div className="relative">
                <div 
                  className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-[#0d0d0d] flex items-center justify-center text-xs font-bold text-silver hover:border-white/40 hover:silver-glow transition-all duration-500 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                >
                  {!profile && user ? (
                    <Loader2 size={16} className="animate-spin text-silver/40" />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.email?.[0].toUpperCase()
                  )}
                </div>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-3 w-56 p-2 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-3xl z-[100]"
                    >
                        <div className="px-4 py-3 border-b border-white/[0.03] mb-2 bg-white/[0.02] rounded-t-xl">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-1.5 opacity-60">Architect</p>
                            <p className="text-xs font-bold truncate text-silver group-hover:text-white transition-colors">{profile?.username || user.email}</p>
                        </div>
                        <div className="p-1 space-y-0.5">
                          <Link href={`/profile/${profile?.username}`} className="nav-dropdown-btn">
                              <UserIcon size={14} className="opacity-50" /> 
                              <span>Profile</span>
                          </Link>
                          <Link href="/settings" className="nav-dropdown-btn">
                              <Settings size={14} className="opacity-50" /> 
                              <span>Settings</span>
                          </Link>
                          <button onClick={() => setShowAccountSwitcher(true)} className="nav-dropdown-btn">
                              <Users size={14} className="opacity-50" /> 
                              <span>Switch Account</span>
                          </button>
                        </div>
                        <div className="h-px bg-white/[0.03] my-2" />
                        <div className="p-1">
                          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="nav-dropdown-btn text-red-500/60 hover:text-red-500 hover:bg-red-500/5">
                              <LogOut size={14} className="opacity-50" /> 
                              <span>Sign Out</span>
                          </button>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
            </div>
          )}
        </div>
      </div>
      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />
      <style jsx>{`
        .nav-dropdown-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1a1; transition: all 0.2s; }
        .nav-dropdown-btn:hover { background: rgba(255, 255, 255, 0.04); color: white; scale: 1.01; }
      `}</style>
    </nav>
  )
}
