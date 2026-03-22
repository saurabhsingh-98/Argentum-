"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Search, Loader2, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getStoredSecretKey, initializeEncryption, resetKeys } from '@/lib/crypto'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelativeTime } from '@/lib/utils/time'
import AccountSwitcher from '@/components/AccountSwitcher'
import { Settings, Users, ShieldAlert, Key as KeyIcon } from 'lucide-react'
import KeyBackupModal from '@/components/KeyBackupModal'
import KeyRecoveryModal from '@/components/KeyRecoveryModal'
import { ProcessedConversation, ConversationWithParticipants } from '@/types/chat'
import { Database } from '@/types/database'
import { User } from '@supabase/supabase-js'

interface MessagesClientProps {
  initialUser: User
  initialProfile: Database['public']['Tables']['users']['Row'] | null
}

export default function MessagesClient({ initialUser, initialProfile }: MessagesClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<ProcessedConversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<ProcessedConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const supabase = createClient() as any

  useEffect(() => {
    let channel: any
    const setup = async () => {
      try {
        const status = await initializeEncryption()
        setEncryptionStatus(status?.status || 'ready')
        
        if (status?.status === 'needs_recovery') {
          setShowRecoveryModal(true)
        } else if (status?.status === 'initialized' && !localStorage.getItem('ag_backup_prompted')) {
          setShowBackupModal(true)
          localStorage.setItem('ag_backup_prompted', 'true')
        }

        await fetchConversations(initialUser.id)
        
        channel = supabase
          .channel('public:messages')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            () => {
              fetchConversations(initialUser.id)
            }
          )
          .subscribe()
      } catch (err) {
        console.error('MessagesClient error:', err)
      }
    }

    setup()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [initialUser.id])

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

      const processedConversations = (data as ConversationWithParticipants[]).map((conv): ProcessedConversation => {
        const otherParticipant = conv.participant_1 === userId 
          ? conv.participant_2_profile 
          : conv.participant_1_profile

        const lastMessage = conv.messages?.length > 0 
          ? conv.messages[conv.messages.length - 1] 
          : null

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
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Panel: Conversation List */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full md:w-[320px] border-r border-border bg-card flex flex-col z-20"
      >
        {/* Header content... rest of the component remains similar but uses initialProfile/initialUser */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/feed" className="p-2 -ml-2 hover:bg-white/5 rounded-xl text-foreground/40 hover:text-foreground transition-all">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-black tracking-tighter">Messages</h1>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-xl transition-all text-foreground/40 hover:text-foreground">
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
              className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-border focus:bg-background/50 transition-all placeholder:text-foreground/30"
            />
          </div>
        </div>

         {/* Backup Nag Banner */}
        {encryptionStatus === 'ready' && 
          (!initialProfile?.key_backup_method || initialProfile.key_backup_method === 'none') && (
          <div className="p-4 mx-4 mb-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
            <div className="flex gap-3">
              <ShieldAlert size={16} className="text-orange-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Unprotected Account</p>
                <p className="text-[11px] text-orange-500/60 font-medium leading-relaxed">Your messages aren{"'"}t backed up. You{"'"}ll lose access if you lose this device.</p>
                <button 
                  onClick={() => setShowBackupModal(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-white hover:text-orange-500 transition-colors"
                >
                  Setup Argentum Shield →
                </button>
              </div>
            </div>
          </div>
        )}

        {encryptionStatus === 'missing_private_key' && (
          <div className="p-4 mx-4 mb-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
             <div className="flex gap-3">
              <KeyIcon size={16} className="text-red-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Messages Locked</p>
                <p className="text-[11px] text-red-500/60 font-medium leading-relaxed">This device doesn{"'"}t have your keys. Set up backup on your other device to unlock, or reset to start fresh.</p>
                <button 
                  onClick={async () => {
                    if (confirm("Resetting keys will make all existing messages unreadable. You will only be able to read new messages sent after this reset. Continue?")) {
                      await resetKeys();
                      window.location.reload();
                    }
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-white hover:text-red-500 transition-colors underline"
                >
                  Reset My Keys & Unlock Messaging →
                </button>
              </div>
             </div>
          </div>
        )}

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 px-6 text-center gap-3">
               <div className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-foreground/40">
                <span className="text-xs font-bold uppercase tracking-widest selection:bg-transparent">Ag</span>
              </div>
              <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredConversations.map((conv) => (
                <Link 
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="px-4 py-4 flex items-center gap-4 hover:bg-foreground/5 transition-all group border-l-2 border-transparent"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border border-border overflow-hidden bg-card flex items-center justify-center text-silver group-hover:border-foreground/20 transition-all">
                      {conv.otherParticipant.avatar_url ? (
                        <Image 
                          src={conv.otherParticipant.avatar_url} 
                          alt="avatar" 
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-black">
                          {conv.otherParticipant.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || conv.otherParticipant.username?.[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground truncate group-hover:glass:glass-text transition-all">
                        {conv.otherParticipant.display_name || `@${conv.otherParticipant.username}`}
                      </span>
                      {conv.lastMessageTime && (
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
                          {formatRelativeTime(conv.lastMessageTime)}
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
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-xl border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center text-silver font-black text-xs">
              {initialProfile?.avatar_url ? (
                <Image 
                 src={initialProfile.avatar_url} 
                 alt="avatar"
                 width={36}
                 height={36}
                 className="w-full h-full object-cover"
               />
              ) : initialUser.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{initialProfile?.display_name || initialProfile?.username || initialUser.email}</p>
              <p className="text-[10px] text-gray-600 font-mono font-bold truncate">@{initialProfile?.username || 'user'}</p>
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
      </motion.div>

       <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />
      
      <KeyBackupModal 
        isOpen={showBackupModal} 
        onClose={() => setShowBackupModal(false)}
        onSuccess={() => {
          setShowBackupModal(false)
          window.location.reload()
        }}
      />

      <KeyRecoveryModal 
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onSuccess={() => {
          setShowRecoveryModal(false)
          window.location.reload()
        }}
      />
    </div>
  )
}
