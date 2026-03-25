"use client"

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Settings,
  LogOut,
  User as UserIcon,
  Flame,
  ChevronDown,
  Home,
  Compass
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import AccountSwitcher from './AccountSwitcher'
import { motion, AnimatePresence } from 'framer-motion'
import StreakModal from './StreakModal'
import { useSearch } from '@/context/SearchContext'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['users']['Row']

interface NavbarProps {
  onSearchClick?: () => void
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  
  // State
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | Partial<Profile> | null>(null)
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  const { setIsOpen: setIsSearchOpen } = useSearch()
  
  // Refs
  const islandRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handlers
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20)
  }, [])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // If clicking outside the island, close both expansion and dropdown
    if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
      setIsExpanded(false)
      setShowDropdown(false)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setShowDropdown(false)
  }

  // Effect: Close menu on route change
  useEffect(() => {
    setIsExpanded(false)
    setShowDropdown(false)
  }, [pathname])

  // Effect: Main setup and listeners
  useEffect(() => {
    const setup = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        if (profileData) {
          setProfile(profileData)
        } else {
          setProfile({
            display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Builder',
            username: authUser.user_metadata?.username || null,
            avatar_url: authUser.user_metadata?.avatar_url || null
          })
        }
      }
    }

    setup()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setup()
      else setProfile(null)
    })

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [supabase, handleScroll, handleClickOutside])

  const navLinks = [
    { name: 'Feed', href: '/feed' },
    { name: 'Explore', href: '/explore' },
    { name: 'Collab', href: '/collab' }
  ]

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
        <motion.div
          ref={islandRef}
          layout
          initial={false}
          animate={{
            width: isExpanded ? '90%' : isScrolled ? '320px' : '480px',
            maxWidth: isExpanded ? '1100px' : '480px',
            borderRadius: isExpanded ? '28px' : '32px',
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className="pointer-events-auto relative bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.1)] overflow-hidden group/island silver-glow-sm island-shimmer"
        >
          <div className="flex items-center h-14 px-3 relative">
            <div className="flex items-center gap-3 shrink-0 ml-1">
              <Link href="/" className="flex items-center gap-2.5 group/logo h-10 px-1 rounded-full hover:bg-white/5 transition-colors">
                <motion.div layout className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shadow-inner">
                  <img src="/logo.png" alt="Ag" className="w-6 h-6 object-contain" />
                </motion.div>
                <AnimatePresence mode="wait">
                  {(isExpanded || !isScrolled) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-0.5">Argentum</span>
                      <span className="text-[6px] text-muted font-bold uppercase tracking-widest opacity-40">Protocol</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            <AnimatePresence>
               {(isExpanded || !isScrolled) && (
                 <motion.div 
                   initial={{ opacity: 0, scaleY: 0 }}
                   animate={{ opacity: 1, scaleY: 1 }}
                   exit={{ opacity: 0, scaleY: 0 }}
                   className="h-6 w-px bg-white/10 mx-2" 
                 />
               )}
            </AnimatePresence>

            <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
               <AnimatePresence mode="wait">
                  {isExpanded ? (
                    <motion.div 
                      key="expanded-nav"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-6 w-full px-4"
                    >
                      {navLinks.map((link) => (
                        <Link 
                          key={link.name} 
                          href={link.href} 
                          className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all relative py-1
                            ${pathname === link.href ? 'text-white' : 'text-muted hover:text-white'}
                          `}
                        >
                          {link.name}
                          {pathname === link.href && (
                            <motion.div layoutId="nav-pill" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-silver rounded-full" />
                          )}
                        </Link>
                      ))}
                      
                      <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 hover:border-white/10 transition-all cursor-text" onClick={() => setIsSearchOpen(true)}>
                         <Search size={14} className="text-muted" />
                         <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Search builds...</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="collapsed-nav"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-4"
                    >
                       <button onClick={() => setIsSearchOpen(true)} className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-full transition-all">
                         <Search size={16} />
                       </button>
                       <AnimatePresence>
                         {!isScrolled && (
                           <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex gap-4 overflow-hidden">
                              {navLinks.slice(0, 2).map((link) => (
                                <Link key={link.name} href={link.href} className="text-[8px] font-black uppercase tracking-widest text-muted hover:text-white whitespace-nowrap">
                                  {link.name}
                                </Link>
                              ))}
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 shrink-0 pr-1">
               {user ? (
                 <>
                   <div className="flex items-center gap-1">
                      <Link href="/new" className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-full transition-all" title="New Build">
                        <Plus size={18} />
                      </Link>
                      <button onClick={() => setShowStreakModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 group/streak hover:border-orange-500/40 transition-all">
                        <Flame size={12} className="text-orange-500" />
                        <span className="text-[10px] font-black">{profile?.streak_count || 0}</span>
                      </button>
                   </div>

                   <button 
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
                   >
                     <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <ChevronDown size={14} />
                     </motion.div>
                   </button>

                   <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center group/avatar hover:border-white/30 transition-all"
                      >
                         {profile?.avatar_url && !avatarError ? (
                            <Image src={profile.avatar_url} alt="A" width={32} height={32} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                         ) : (
                            <span className="text-[10px] font-black opacity-40">{profile?.username?.[0] || 'B'}</span>
                         )}
                      </button>
                      
                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 8 }}
                            className="absolute right-0 mt-3 w-56 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-3xl z-[150] overflow-hidden"
                          >
                             <div className="p-4 bg-white/[0.03] border-b border-white/5">
                                <span className="text-[10px] font-black uppercase text-white truncate block">{profile?.display_name || 'Builder'}</span>
                                <span className="text-[8px] text-muted font-mono truncate block">@{profile?.username || 'anonymous'}</span>
                             </div>
                             <div className="p-1.5">
                                <DropdownItem icon={<UserIcon size={12} />} label="Profile" href={`/profile/${profile?.username}`} />
                                <DropdownItem icon={<Settings size={12} />} label="Settings" href="/settings" />
                                <div className="h-px bg-white/5 my-1" />
                                <button 
                                  onClick={handleSignOut}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                  <LogOut size={12} /> Sign Out
                                </button>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                 </>
               ) : (
                 <Link href="/auth/login" className="px-5 py-2 rounded-full silver-metallic text-[10px] font-black uppercase tracking-widest shadow-2xl">
                   Join
                 </Link>
               )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-xl border-t border-border z-[100] flex items-center justify-around px-4">
        <MobileNavItem icon={<Home size={20} />} label="Feed" href="/feed" active={pathname === '/feed'} />
        <MobileNavItem icon={<Compass size={20} />} label="Explore" href="/explore" active={pathname === '/explore'} />
        <Link href="/new" className="w-12 h-12 silver-metallic rounded-2xl flex items-center justify-center text-black -translate-y-4 shadow-glow-silver/30 active:scale-90 transition-all">
           <Plus size={24} />
        </Link>
        <MobileNavItem icon={<MessageCircle size={20} />} label="Chat" href="/messages" active={pathname === '/messages'} />
        <MobileNavItem icon={<UserIcon size={20} />} label="Me" href={profile?.username ? `/profile/${profile.username}` : (user ? '/onboarding' : '/auth/login')} active={pathname?.startsWith('/profile')} />
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

function DropdownItem({ icon, label, href, onClick }: { icon: React.ReactNode, label: string, href: string, onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary hover:bg-foreground/5 rounded-xl transition-all"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function MobileNavItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary' : 'text-muted hover:text-primary'}`}>
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  )
}
