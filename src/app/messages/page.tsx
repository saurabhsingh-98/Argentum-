"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Search, Loader2, Plus, Lock, AtSign } from 'lucide-react'
import Link from 'next/link'
import { decryptMessage, getStoredSecretKey, initializeEncryption } from '@/lib/crypto'
import { motion, AnimatePresence } from 'framer-motion'
import AccountSwitcher from '@/components/AccountSwitcher'
import { Settings, Users, LogOut, User } from 'lucide-react'

export default function MessagesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [filteredConversations, setFilteredConversations] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      }
      setUser(user)

      const status = await initializeEncryption()
      setEncryptionStatus(status?.status || 'ready')

      const { data: prof } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      await fetchConversations(user.id)
      
      const channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => {
            fetchConversations(user.id)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter(conv => 
        conv.otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.otherParticipant.display_name && conv.otherParticipant.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredConversations(filtered)
    }
  }, [searchQuery, conversations])

  const fetchConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:users!conversations_participant_1_fkey(id, username, display_name, avatar_url, public_key),
          participant_2_profile:users!conversations_participant_2_fkey(id, username, display_name, avatar_url, public_key),
          messages(content, created_at, sender_id)
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const secretKey = getStoredSecretKey()
      
      const processedConversations = data.map((conv: any) => {
        const otherParticipant = conv.participant_1 === userId 
          ? conv.participant_2_profile 
          : conv.participant_1_profile

        const lastMessage = conv.messages?.length > 0 
          ? conv.messages[conv.messages.length - 1] 
          : null

        // In this view, we just show "Encrypted" as per requirements
        return {
          ...conv,
          otherParticipant,
          lastMessagePreview: lastMessage ? "🔒 Encrypted" : "No messages yet",
          lastMessageTime: lastMessage ? new Date(lastMessage.created_at) : null
        }
      })

      setConversations(processedConversations)
      setFilteredConversations(processedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#050505] flex overflow-hidden">
      {/* Left Panel: Conversation List */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full md:w-[320px] border-r border-white/5 bg-[#0a0a0a] flex flex-col z-20"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h1 className="text-xl font-black text-white tracking-tighter">Messages</h1>
          <button className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white">
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-silver transition-colors" />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-white/10 focus:bg-white/[0.07] transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 px-6 text-center gap-3">
               <div className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-gray-700">
                <span className="text-xs font-bold uppercase tracking-widest selection:bg-transparent">Ag</span>
              </div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredConversations.map((conv) => (
                <Link 
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="px-4 py-4 flex items-center gap-4 hover:bg-white/[0.03] transition-all group border-l-2 border-transparent"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center text-silver group-hover:border-white/20 transition-all">
                      {conv.otherParticipant.avatar_url ? (
                        <img src={conv.otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black">
                          {conv.otherParticipant.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || conv.otherParticipant.username?.[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white truncate group-hover:silver-glow-text transition-all">
                        {conv.otherParticipant.display_name || `@${conv.otherParticipant.username}`}
                      </span>
                      {conv.lastMessageTime && (
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                          {conv.lastMessageTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <p className="text-[11px] text-gray-500 truncate font-medium">
                        {conv.lastMessagePreview}
                      </p>
                      <span className="text-[10px] text-gray-700 font-bold truncate">@{conv.otherParticipant.username}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Profile Footer */}
        {user && (
           <div className="p-4 border-t border-white/5 bg-[#0d0d0d]/50 backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-4 px-2">
               <div className="w-9 h-9 rounded-xl border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center text-silver font-black text-xs">
                 {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : user.email?.[0].toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold truncate text-white">{profile?.display_name || profile?.username || user.email}</p>
                 <p className="text-[10px] text-gray-600 font-mono font-bold truncate">@{profile?.username || 'user'}</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/settings" 
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                >
                  <Settings size={14} /> Settings
                </Link>
                <button 
                  onClick={() => setShowAccountSwitcher(true)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all font-bold"
                >
                  <Users size={14} /> Switch
                </button>
             </div>
           </div>
        )}
      </motion.div>

      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />

      {/* Right Panel: Placeholder for Chat Window (Visible on desktop) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#050505] relative"
      >
        <div className="mesh-gradient-bg opacity-10 absolute inset-0 pointer-events-none" />
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] border border-white/5 bg-[#0a0a0a] flex items-center justify-center text-gray-800 shadow-2xl relative">
            <div className="absolute inset-0 bg-silver/5 blur-3xl rounded-full" />
             <MessageCircle size={40} className="relative z-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-white tracking-tighter">Your Encrypted Space</h2>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              Select a conversation to start chatting securely with fellow builders.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
