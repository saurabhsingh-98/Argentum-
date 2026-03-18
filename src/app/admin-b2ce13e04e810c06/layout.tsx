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
  ShieldAlert,
  Shield
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import AdminSessionTimer from '@/components/admin/AdminSessionTimer'

const ADMIN_SEGMENT = 'b2ce13e04e810c06';

const navItems = [
  { label: 'Overview', href: `/admin-${ADMIN_SEGMENT}`, icon: BarChart3 },
  { label: 'Security', href: `/admin-${ADMIN_SEGMENT}/security`, icon: Shield },
  { label: 'Users', href: `/admin-${ADMIN_SEGMENT}/users`, icon: Users },
  { label: 'Posts', href: `/admin-${ADMIN_SEGMENT}/posts`, icon: FileText },
  { label: 'Reports', href: `/admin-${ADMIN_SEGMENT}/reports`, icon: Flag },
  { label: 'Issues', href: `/admin-${ADMIN_SEGMENT}/issues`, icon: Bug },
  { label: 'Status Updates', href: `/admin-${ADMIN_SEGMENT}/status`, icon: MessageSquare },
  { label: 'Audit Log', href: `/admin-${ADMIN_SEGMENT}/audit`, icon: History },
  { label: 'Settings', href: `/admin-${ADMIN_SEGMENT}/settings`, icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
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
    <div className="flex h-screen bg-background text-foreground selection:bg-red-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col z-50">
        <div className="p-8 pb-6">
          <Link href={`/admin-${ADMIN_SEGMENT}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
               <ShieldAlert size={20} className="text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none text-foreground">Ag</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Security</span>
            </div>
          </Link>
        </div>

        <div className="px-4 mb-6">
          <AdminSessionTimer />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-xl transition-all group
                  ${isActive 
                    ? 'bg-red-600/10 text-red-500 border-l-2 border-red-500' 
                    : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
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
        <div className="p-6 border-t border-border bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl border border-border overflow-hidden bg-red-500/10 flex items-center justify-center text-red-500 text-xs font-black">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                profile?.username?.[0].toUpperCase() || 'A'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground uppercase tracking-tight">{profile?.display_name || profile?.username}</p>
              <p className="text-[9px] text-red-500/60 font-black uppercase tracking-widest">Administrator</p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <LogOut size={14} /> Exit Dash
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background relative custom-scrollbar">
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
