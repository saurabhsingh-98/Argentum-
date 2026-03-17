"use client"

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Loader2, 
  MessageCircle, 
  Bell,
  Settings,
  Users,
  LogOut,
  User as UserIcon,
  Flame,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  Home,
  Compass
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import AccountSwitcher from './AccountSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import StreakModal from './StreakModal'
import { useSearch } from '@/context/SearchContext'

interface NavbarProps {
  onSearchClick?: () => void
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const { setIsOpen: setIsSearchOpen } = useSearch()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const setup = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const { data: prof } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (prof) setProfile(prof)
      }
    }
    setup()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      if (session?.user) setup()
      else setProfile(null)
    })

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [supabase])

  const navLinks = [
    { name: 'Feed', href: '/feed' },
    { name: 'Explore', href: '/explore' }
  ]

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left Section: Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-8 h-8 rounded-lg border border-silver/30 flex items-center justify-center bg-[#111] shadow-glow-silver/0 group-hover:shadow-glow-silver/20 group-hover:border-silver/50 transition-all duration-300"
              >
                <span className="text-xs font-black text-white italic group-hover:silver-glow-text">Ag</span>
              </motion.div>
              <motion.span 
                whileHover={{ letterSpacing: "0.5em" }}
                className="text-[11px] font-black tracking-[0.4em] text-silver/40 group-hover:text-silver group-hover:silver-glow-text transition-all duration-500 hidden md:block"
              >
                ARGENTUM
              </motion.span>
            </Link>
          </div>

          {/* Center Section: Navigation & Search */}
          <div className="flex-1 flex items-center justify-center max-w-4xl gap-8">
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-1
                    ${pathname === link.href ? 'text-white' : 'text-white/40 hover:text-white'}
                  `}
                >
                  {link.name}
                  {pathname === link.href && (
                    <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-px bg-green-500" />
                  )}
                </Link>
              ))}
            </div>

            {/* YouTube-style Search Bar */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 max-w-xl relative hidden md:block group cursor-text"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] group-hover:border-white/20 transition-all">
                <Search size={16} className="text-white/20" />
                <div className="text-sm text-white/30 flex-1">Search builds, builders, tags...</div>
                <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5">
                  <span className="text-[8px] font-black text-white/30 tracking-widest uppercase">Cmd+K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
            {/* Mobile Search Trigger (Always Visible) */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 flex md:hidden items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all mr-1"
            >
              <Search size={18} />
            </button>

            {user ? (
              <>
                <div className="flex items-center gap-1 md:gap-3">
                  <Link 
                    href="/messages"
                    className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all relative"
                  >
                    <MessageCircle size={18} />
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                  </Link>

                  <NotificationBell />

                  <Link 
                    href="/new" 
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full silver-metallic text-[#050505] text-[10px] font-black uppercase tracking-widest shadow-glow-silver/20 hover:brightness-110 transition-all active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Build Log</span>
                  </Link>
                </div>

                <div className="h-4 w-px bg-white/10 hidden md:block mx-1" />

                {/* Streak Counter */}
                <button 
                   onClick={() => setShowStreakModal(true)}
                   className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 group/streak hover:border-orange-500/40 transition-all"
                >
                   <Flame size={14} className="text-orange-500 group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-black text-white">{profile?.streak_count || 0}</span>
                </button>

                {/* Profile Circle */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center group/avatar hover:border-white/30 transition-all"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-white/40 group-hover/avatar:text-white transition-colors uppercase">
                         {profile?.username?.[0] || user.email?.[0]}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-3 w-60 bg-[#111] border border-white/10 rounded-2xl shadow-3xl z-[150] overflow-hidden"
                      >
                          <div className="p-4 bg-white/[0.02] border-b border-white/5">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <span className="font-black text-xs">{profile?.username?.[0]}</span>}
                               </div>
                               <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-white truncate">{profile?.display_name || profile?.username}</span>
                                  <span className="text-[10px] text-white/30 font-mono truncate">@{profile?.username}</span>
                               </div>
                            </div>
                          </div>
                   
                          <div className="p-1">
                            <DropdownItem icon={<UserIcon size={14} />} label="View Profile" href={`/profile/${profile?.username}`} />
                            <DropdownItem icon={<Settings size={14} />} label="Edit Profile" href="/settings" />
                            <DropdownItem icon={<Bell size={14} />} label="Notifications" href="/notifications" />
                            <DropdownItem icon={<MessageCircle size={14} />} label="Messages" href="/messages" />
                            <DropdownItem icon={<LayoutGrid size={14} />} label="Settings" href="/settings" />
                            
                            <div className="h-px bg-white/5 my-1" />
                            <button 
                              onClick={() => { setShowAccountSwitcher(true); setShowDropdown(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                              <Users size={14} /> Switch Account
                            </button>
                            <button 
                              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                            >
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link 
                href="/auth/login"
                className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 z-[100] flex items-center justify-around px-4">
        <MobileNavItem icon={<Home size={20} />} label="Feed" href="/feed" active={pathname === '/feed'} />
        <MobileNavItem icon={<Compass size={20} />} label="Explore" href="/explore" active={pathname === '/explore'} />
        <Link href="/new" className="w-12 h-12 silver-metallic rounded-2xl flex items-center justify-center text-black -translate-y-4 shadow-glow-silver/30 active:scale-90 transition-all">
           <Plus size={24} />
        </Link>
        <MobileNavItem icon={<MessageCircle size={20} />} label="Chat" href="/messages" active={pathname === '/messages'} />
        <MobileNavItem icon={<UserIcon size={20} />} label="Me" href={`/profile/${profile?.username}`} active={pathname?.startsWith('/profile')} />
      </div>

      <StreakModal 
        isOpen={showStreakModal} 
        onClose={() => setShowStreakModal(false)} 
        userId={user?.id}
      />
      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />
    </>
  )
}

function DropdownItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function MobileNavItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 ${active ? 'text-green-500' : 'text-white/40'}`}>
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  )
}
