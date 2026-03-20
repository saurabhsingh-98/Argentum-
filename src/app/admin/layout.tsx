"use client"

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3, 
  Users, 
  FileText, 
  Flag, 
  Bug, 
  MessageSquare, 
  History, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { label: 'Overview', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Posts', href: '/admin/posts', icon: FileText },
  { label: 'Reports', href: '/admin/reports', icon: Flag },
  { label: 'Issues', href: '/admin/issues', icon: Bug },
  { label: 'Status Updates', href: '/admin/status', icon: MessageSquare },
  { label: 'Audit Log', href: '/admin/audit', icon: History },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient() as any
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase
          .from('users')
          .select('username, display_name, avatar_url')
          .eq('id', user.id)
          .single()
        setProfile(prof)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="flex h-screen bg-[#050505] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col z-50">
        <div className="p-8 pb-10">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
               <ShieldAlert size={20} className="text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none">Ag</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Admin</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-red-600/10 text-red-400 border-l-2 border-red-500' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <item.icon size={18} className={isActive ? 'text-red-500' : 'group-hover:text-red-500 transition-colors'} />
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="active-pill"
                     className="ml-auto"
                   >
                     <ChevronRight size={14} />
                   </motion.div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Admin Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0d0d0d]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl border border-white/10 overflow-hidden bg-red-500/10 flex items-center justify-center text-red-500 text-xs font-black">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                profile?.username?.[0].toUpperCase() || 'A'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white uppercase tracking-tight">{profile?.display_name || profile?.username}</p>
              <p className="text-[9px] text-red-500/60 font-black uppercase tracking-widest">Administrator</p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={14} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar">
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
