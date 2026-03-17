"use client"

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, 
  ArrowLeft, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  User, 
  AtSign, 
  CheckCircle2, 
  MoreVertical, 
  Volume2, 
  VolumeX, 
  UserCircle, 
  Ban, 
  X, 
  Copy, 
  Smile, 
  AlertTriangle, 
  Trash2,
  Pencil,
  Paperclip,
  Check,
  Eye,
  Clock,
  Reply,
  Undo2,
  MoreHorizontal,
  ThumbsUp,
  Heart,
  Laugh,
  MessageCircle,
  Shield,
  Trash,
  ChevronRight,
  Search,
  Zap,
  Frown,
  Flame,
  Settings,
  Users,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { decryptMessage, encryptMessage, getStoredSecretKey, initializeEncryption } from '@/lib/crypto'
import { motion, AnimatePresence } from 'framer-motion'
import AccountSwitcher from '@/components/AccountSwitcher'

const supabase = createClient()

export default function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')
  
  // Advanced Features State
  const [showMenu, setShowMenu] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [nickname, setNickname] = useState('')
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: any, isOwn: boolean } | null>(null)
  const [bgContextMenu, setBgContextMenu] = useState<{ x: number, y: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setCurrentUser(user)

      const status = await initializeEncryption()
      setEncryptionStatus(status?.status || 'ready')

      // Fetch conversation details with disappearing settings
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:users!conversations_participant_1_fkey(*),
          participant_2_profile:users!conversations_participant_2_fkey(*)
        `)
        .eq('id', conversationId)
        .single()

      if (convError || !conv) {
        router.push('/messages')
        return
      }

      const other = conv.participant_1 === user.id ? conv.participant_2_profile : conv.participant_1_profile
      setConversation(conv)
      setOtherParticipant(other)

      // Load LocalStorage Features
      const muted = localStorage.getItem(`muted_${conversationId}`) === 'true'
      setIsMuted(muted)
      const savedNickname = localStorage.getItem(`nickname_${other.id}`) || ''
      setNickname(savedNickname)

      // Initial messages fetch
      await fetchMessages(conv, user.id)
      setLoading(false)
      setTimeout(() => scrollToBottom('auto'), 100)

      // Mark as read on entry
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null)

      // Subscribe to real-time updates as per user request
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          async (payload: any) => {
            const processed = processMessage(payload.new, conv, user.id)
            if (processed) {
              setMessages((prev: any[]) => [...prev, processed])
              setTimeout(() => scrollToBottom(), 50)
            }
          }
        )
        // Keep existing UPDATE/DELETE handlers for receipts and unsends
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          async (payload: any) => {
            const processed = processMessage(payload.new, conv, user.id)
            if (processed) {
              setMessages((prev: any[]) => prev.map(m => m.id === payload.new.id ? { ...m, ...processed } : m))
            } else {
              setMessages((prev: any[]) => prev.filter(m => m.id !== payload.new.id))
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload: any) => {
            setMessages((prev: any[]) => prev.filter(m => m.id !== payload.old.id))
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `id=eq.${other.id}` },
          (payload: any) => {
            setOtherParticipant((prev: any) => ({ ...prev, ...payload.new }))
          }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
            (payload: any) => {
                setConversation((prev: any) => ({ ...prev, ...payload.new }))
            }
        )
        .subscribe();

      return channel;
    }

    let channel: any
    setup().then(c => { channel = c })

    // ... existing interval logic ...

    // Expiry check interval
    const interval = setInterval(() => {
        checkExpiries()
    }, 30000)

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
      if (!isEditingId) setContextMenu(null)
      setBgContextMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
        document.removeEventListener('click', handleClickOutside)
        clearInterval(interval)
        if (channel) supabase.removeChannel(channel)
    }
  }, [conversationId])

  const isEditingId = editingId

  const checkExpiries = () => {
      const now = new Date()
      setMessages((prev: any[]) => prev.map(msg => {
          if (msg.expires_at && new Date(msg.expires_at) < now && !msg.deleted_for?.includes(currentUser.id)) {
              // Usually we'd update DB here but local UI feedback is first
              return { ...msg, expired: true }
          }
          return msg
      }))
  }

  const processMessage = (msg: any, convData: any, userId: string) => {
    if (msg.deleted_for?.includes(userId)) return null
    
    const secretKey = getStoredSecretKey()
    let decrypted = msg.content
    
    if (!msg.content.startsWith('[IMAGE]:')) {
        const isOwn = msg.sender_id === userId
        const otherProfile = convData.participant_1 === userId ? convData.participant_2_profile : convData.participant_1_profile
        const senderProfile = convData.participant_1 === msg.sender_id ? convData.participant_1_profile : convData.participant_2_profile
        const decryptionKey = isOwn ? otherProfile.public_key : senderProfile.public_key
        
        if (secretKey) {
          decrypted = decryptMessage(msg.content, decryptionKey, secretKey) || "Encrypted message"
        } else {
          decrypted = "Encrypted message"
        }
    }

    return {
      ...msg,
      decryptedContent: decrypted,
      expired: msg.expires_at && new Date(msg.expires_at) < new Date()
    }
  }

  const fetchMessages = async (conv: any, userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) return

    const processedMessages = data.map((msg: any) => processMessage(msg, conv, userId)).filter(Boolean)
    setMessages(processedMessages)
  }

  const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string) => {
    if (e) e.preventDefault()
    const content = contentOverride || newMessage
    if (!content.trim() || sending || !otherParticipant || !conversation) return

    const secretKey = getStoredSecretKey()
    if (!secretKey && !content.startsWith('[IMAGE]:')) {
      alert("Encryption keys missing.")
      return
    }

    setSending(true)

    try {
      let finalContent = content
      if (!content.startsWith('[IMAGE]:')) {
          finalContent = encryptMessage(content, otherParticipant.public_key, secretKey!)
      }

      // Calculate Expiry based on conversation settings
      let expiresAt = null
      if (conversation.disappearing_messages !== 'off') {
          const now = new Date()
          if (conversation.disappearing_messages === '24h') now.setDate(now.getDate() + 1)
          else if (conversation.disappearing_messages === '7d') now.setDate(now.getDate() + 7)
          expiresAt = now.toISOString()
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: finalContent,
          expires_at: expiresAt
        })

      if (error) throw error
      setNewMessage('')
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) return alert("Max 5MB")

      setUploading(true)
      setUploadProgress(10)

      try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${conversationId}/${fileName}`

          const { error: uploadError } = await supabase.storage
              .from('message-attachments')
              .upload(filePath, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
              .from('message-attachments')
              .getPublicUrl(filePath)

          await handleSendMessage(undefined, `[IMAGE]:${publicUrl}`)
      } catch (err) {
          console.error(err)
      } finally {
          setUploading(false)
          setUploadProgress(0)
      }
  }

  const handleContextMenu = (e: React.MouseEvent, msg: any, isOwn: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, msg, isOwn })
    setBgContextMenu(null)
  }

  const handleEditMessage = async () => {
      if (!editingId || !editContent.trim() || !otherParticipant) return
      const secretKey = getStoredSecretKey()
      if (!secretKey) return

      try {
          const encrypted = encryptMessage(editContent, otherParticipant.public_key, secretKey)
          await supabase.from('messages').update({ content: encrypted, is_edited: true }).eq('id', editingId)
          setEditingId(null)
          setEditContent('')
      } catch (err) {
          console.error(err)
      }
  }

  const handleBgContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setBgContextMenu({ x: e.clientX, y: e.clientY })
    setContextMenu(null)
  }

  const deleteMessage = async (msg: any, everyone: boolean) => {
      if (everyone) {
          const sentTime = new Date(msg.created_at).getTime()
          const now = new Date().getTime()
          const diffHours = (now - sentTime) / (1000 * 60 * 60)
          
          if (diffHours > 1) {
              alert("You can only delete for everyone within 1 hour of sending.")
              return
          }
          await supabase.from('messages').delete().eq('id', msg.id)
      } else {
          // Add self to deleted_for
          const { data: dbMsg } = await supabase.from('messages').select('deleted_for').eq('id', msg.id).single()
          const deletedFor = [...(dbMsg?.deleted_for || []), currentUser.id]
          await supabase.from('messages').update({ deleted_for: deletedFor }).eq('id', msg.id)
      }
      setContextMenu(null)
  }

  const setExpiry = async (msg: any, time: string) => {
      const now = new Date()
      let expiresAt = null
      if (time === 'After viewing') expiresAt = now.toISOString()
      else if (time === '1 Day') now.setDate(now.getDate() + 1), expiresAt = now.toISOString()
      else if (time === '1 Week') now.setDate(now.getDate() + 7), expiresAt = now.toISOString()
      else if (time === 'Lifetime') expiresAt = null
      
      await supabase.from('messages').update({ expires_at: expiresAt }).eq('id', msg.id)
      setContextMenu(null)
  }

  const toggleConvSetting = async (key: string, value: any) => {
      await supabase.from('conversations').update({ [key]: value }).eq('id', conversationId)
      setBgContextMenu(null)
  }

  const clearChatHistory = async () => {
      if (!confirm("Are you sure you want to clear your chat history for this conversation? This only deletes it for you.")) return
      
      const msgIds = messages.map(m => m.id)
      for (const id of msgIds) {
          const { data: msg } = await supabase.from('messages').select('deleted_for').eq('id', id).single()
          const deletedFor = [...(msg?.deleted_for || []), currentUser.id]
          await supabase.from('messages').update({ deleted_for: deletedFor }).eq('id', id)
      }
      setMessages([])
      setBgContextMenu(null)
  }

  if (loading || !otherParticipant || !currentUser) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-silver/30" onContextMenu={handleBgContextMenu}>
      <div className="noise-bg absolute inset-0 pointer-events-none opacity-[0.03]" />
      <div className="mesh-gradient-bg opacity-5 absolute inset-0 pointer-events-none" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-[60]"
        >
          <div className="flex items-center gap-4">
            <Link href="/messages" className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <ArrowLeft size={18} className="text-gray-400" />
            </Link>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfilePanel(true)}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center shadow-glow-sm">
                  {otherParticipant.avatar_url ? (
                    <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-silver">{otherParticipant.username[0].toUpperCase()}</span>
                  )}
                </div>
                {otherParticipant.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  {nickname || otherParticipant.display_name || otherParticipant.username}
                  {isMuted && <VolumeX size={12} className="text-gray-500" />}
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1">
                    <Lock size={8} className="text-green-500" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Encrypted</span>
                  </span>
                </h2>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {otherParticipant.is_online ? 'Online now' : `Last seen ${new Date(otherParticipant.last_seen || Date.now()).toLocaleTimeString()}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                <Search size={20} />
             </button>
             <div className="relative">
                 <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                    <MoreVertical size={20} />
                 </button>

                 <AnimatePresence>
                    {showMenu && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-56 p-2 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-3xl z-[100]"
                        >
                            <button onClick={() => { setIsMuted(!isMuted); localStorage.setItem(`muted_${conversationId}`, (!isMuted).toString()); setShowMenu(false); }} className="ctx-btn">
                                {isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />} 
                                {isMuted ? 'Unmute' : 'Mute Notifications'}
                            </button>
                            <button onClick={() => { setShowProfilePanel(true); setShowMenu(false); }} className="ctx-btn">
                                <UserCircle size={16} /> View Profile
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <Link href="/settings" className="ctx-btn">
                                <Settings size={16} /> Site Settings
                            </Link>
                            <button onClick={() => { setShowAccountSwitcher(true); setShowMenu(false); }} className="ctx-btn">
                                <Users size={16} /> Switch Account
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button onClick={() => { setShowMenu(false); router.push('/messages'); }} className="ctx-btn text-red-500/80">
                                <Ban size={16} /> Block User
                            </button>
                        </motion.div>
                    )}
                 </AnimatePresence>
             </div>
          </div>
        </motion.div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
              <div className="w-16 h-16 rounded-[2rem] border border-white/10 flex items-center justify-center text-gray-600">
                <Lock size={24} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 text-center px-10">Messages are end-to-end encrypted. No one else can read them.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.sender_id === currentUser.id
              const isImage = msg.content.startsWith('[IMAGE]:')
              const imageUrl = isImage ? msg.content.replace('[IMAGE]:', '') : null
              
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                     <div className="w-8 h-8 rounded-full border border-white/5 overflow-hidden bg-[#111] flex-shrink-0 mb-5">
                        {otherParticipant.avatar_url ? (
                          <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black">{otherParticipant.username[0].toUpperCase()}</div>
                        )}
                     </div>
                  )}
                  <div 
                    className={`max-w-[80%] md:max-w-[60%] group relative`}
                    onContextMenu={(e) => handleContextMenu(e, msg, isOwn)}
                  >
                    <div className={`relative px-5 py-3.5 text-sm leading-relaxed ${
                      isOwn 
                        ? 'silver-metallic text-[#050505] rounded-2xl rounded-br-none' 
                        : 'bg-[#1a1a1a] text-white rounded-2xl rounded-bl-none border border-white/5'
                    } ${msg.expired ? 'opacity-30' : ''}`}>
                      {msg.expired ? (
                          <div className="flex items-center gap-2 italic">
                              <Clock size={14} /> This message has expired
                          </div>
                      ) : isImage ? (
                          <img 
                            src={imageUrl!} 
                            alt="attachment" 
                            className="rounded-lg max-w-full cursor-pointer hover:brightness-110 transition-all" 
                            onClick={() => setLightboxImage(imageUrl)}
                          />
                      ) : editingId === msg.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                              <textarea 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:outline-none"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/10 rounded"><X size={14} /></button>
                                  <button onClick={handleEditMessage} className="p-1 hover:bg-white/10 rounded"><Check size={14} /></button>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col gap-0.5">
                            {msg.decryptedContent}
                            {msg.is_edited && (
                                <span className="text-[8px] opacity-40 lowercase">(edited)</span>
                            )}
                          </div>
                      )}
                      
                      {msg.expires_at && !msg.expired && (
                          <div className="absolute -top-1 -right-1">
                              <div className="bg-orange-500 w-2 h-2 rounded-full animate-pulse" />
                          </div>
                      )}
                    </div>
                    
                    <div className={`mt-1.5 px-1 flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isOwn && (
                          <div className="flex items-center">
                              {msg.read_at ? (
                                  <CheckCircle2 size={10} className="text-green-500" />
                              ) : (
                                  <div className="flex -space-x-1">
                                      <Check size={10} className="text-gray-600" />
                                      <Check size={10} className="text-gray-600" />
                                  </div>
                              )}
                          </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <motion.div className="p-6 bg-[#111] border-t border-white/5 relative z-50">
          {replyTo && (
              <div className="bg-white/5 p-3 rounded-t-2xl border-x border-t border-white/5 mb-[-1px] flex justify-between items-center animate-slide-up">
                  <div className="flex items-center gap-3">
                      <Reply size={16} className="text-silver" />
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black text-silver uppercase">Replying to msg</span>
                          <span className="text-xs text-gray-500 truncate max-w-md">{replyTo.decryptedContent}</span>
                      </div>
                  </div>
                  <button onClick={() => setReplyTo(null)}><X size={16} className="text-gray-600" /></button>
              </div>
          )}
          
          <div className="max-w-6xl mx-auto flex flex-col gap-3">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all">
                    <Paperclip size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>
              
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
                   <Lock size={16} />
                </div>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a secure message..."
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-silver/40 focus:glow-silver transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-14 h-14 rounded-full bg-[#22c55e] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow-green"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </form>
            {uploading && (
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
            )}
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center">
                End-to-end encrypted · Only you and {nickname || otherParticipant.display_name || otherParticipant.username} can read these messages
            </p>
          </div>
        </motion.div>
      </div>

      {/* Profile Sidebar */}
      <AnimatePresence>
        {showProfilePanel && (
            <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               className="fixed top-0 right-0 h-full w-[360px] bg-[#0d0d0d] border-l border-white/10 shadow-2xl z-[110] p-8 flex flex-col"
            >
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black">Builder Profile</h3>
                    <button onClick={() => setShowProfilePanel(false)}><X size={24} /></button>
                </div>
                {/* Profile implementation mostly same as before, simplified for space */}
                <div className="flex flex-col items-center text-center gap-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-silver/10 blur-2xl group-hover:bg-silver/20 transition-all rounded-full" />
                        <div className="w-28 h-28 rounded-[2.5rem] bg-[#111] border border-white/10 flex items-center justify-center text-4xl font-black text-silver relative z-10 transition-transform group-hover:scale-105">
                            {otherParticipant.avatar_url ? <img src={otherParticipant.avatar_url} className="w-full h-full object-cover rounded-[2.5rem]" /> : otherParticipant.username[0].toUpperCase()}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="text-2xl font-black tracking-tighter text-white">{nickname || otherParticipant.display_name || otherParticipant.username}</h4>
                        <span className="text-[10px] text-gray-500 font-mono font-bold tracking-[0.3em] uppercase opacity-70">@{otherParticipant.username}</span>
                    </div>
                    
                    <div className="w-full space-y-6 mt-4">
                        <div className="flex flex-col gap-3">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] text-left opacity-60">Identity Management</span>
                            <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl focus-within:border-white/20 transition-all">
                                <input 
                                    value={nickname} onChange={(e) => setNickname(e.target.value)}
                                    className="flex-1 bg-transparent border-none rounded-xl px-4 py-2 text-xs focus:ring-0 placeholder:text-gray-700 font-bold"
                                    placeholder="Assign nickname..."
                                />
                                <button 
                                    onClick={() => localStorage.setItem(`nickname_${otherParticipant.id}`, nickname)} 
                                    className="px-5 bg-silver text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-glow-sm"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <Link href={`/profile/${otherParticipant.username}`} className="w-full mt-auto py-4 rounded-2xl silver-metallic text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-glow hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all text-center">
                        Secure Profile Access
                    </Link>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Message Context Menu */}
      <AnimatePresence>
        {contextMenu && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ 
                    left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 240 : contextMenu.x), 
                    top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 320 : contextMenu.y) 
                }}
                className="fixed z-[200] w-56 bg-[#0d0d0d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-3xl p-2 flex flex-col gap-1"
            >
                {!contextMenu.isOwn && (
                    <div className="flex justify-around p-2 border-b border-white/5 mb-1">
                        {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(e => <button key={e} className="hover:scale-125 transition-all">{e}</button>)}
                    </div>
                )}
                <button onClick={() => { navigator.clipboard.writeText(contextMenu.msg.decryptedContent); setContextMenu(null); }} className="ctx-btn"><Copy size={16} /> Copy text</button>
                {contextMenu.isOwn ? (
                    <>
                        {!contextMenu.msg.content.startsWith('[IMAGE]:') && (
                            <button onClick={() => { setEditingId(contextMenu.msg.id); setEditContent(contextMenu.msg.decryptedContent); setContextMenu(null); }} className="ctx-btn">
                                <Pencil size={16} /> Edit message
                            </button>
                        )}
                        <button className="ctx-btn group relative">
                            <Clock size={16} /> Set expiry
                            <ChevronRight size={14} className="ml-auto opacity-50" />
                            <div className="hidden group-hover:block absolute left-full top-0 ml-1 w-40 bg-[#0d0d0d] border border-white/10 rounded-xl p-1 shadow-2xl">
                                {['After viewing', '1 Day', '1 Week', 'Lifetime'].map(opt => (
                                    <button key={opt} onClick={() => setExpiry(contextMenu.msg, opt)} className="ctx-btn text-[9px]">{opt}</button>
                                ))}
                            </div>
                        </button>
                        <button onClick={() => deleteMessage(contextMenu.msg, false)} className="ctx-btn"><Trash2 size={16} /> Delete for me</button>
                        <button onClick={() => deleteMessage(contextMenu.msg, true)} className="ctx-btn text-red-500/80"><Trash2 size={16} /> Delete for everyone</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }} className="ctx-btn"><Reply size={16} /> Reply</button>
                        <button className="ctx-btn text-orange-500/80"><AlertTriangle size={16} /> Report</button>
                    </>
                )}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Area Context Menu */}
      <AnimatePresence>
        {bgContextMenu && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ 
                    left: Math.min(bgContextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 270 : bgContextMenu.x), 
                    top: Math.min(bgContextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 320 : bgContextMenu.y) 
                }}
                className="fixed z-[200] w-64 bg-[#0d0d0d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-3xl p-2 flex flex-col gap-1"
            >
                <button className="ctx-btn group relative">
                    <VolumeX size={16} /> Mute notifications
                    <ChevronRight size={14} className="ml-auto opacity-50" />
                    <div className="hidden group-hover:block absolute left-full top-0 ml-1 w-40 bg-[#0d0d0d] border border-white/10 rounded-xl p-1 shadow-2xl">
                        {['24 Hours', '1 Week', 'Always'].map(opt => (
                            <button key={opt} onClick={() => { setIsMuted(true); localStorage.setItem(`muted_${conversationId}`, 'true'); setBgContextMenu(null); }} className="ctx-btn text-[9px]">{opt}</button>
                        ))}
                    </div>
                </button>
                <button className="ctx-btn group relative">
                    <MessageCircle size={16} /> Disappearing messages
                    <ChevronRight size={14} className="ml-auto opacity-50" />
                    <div className="hidden group-hover:block absolute left-full top-0 ml-1 w-48 bg-[#0d0d0d] border border-white/10 rounded-xl p-1 shadow-2xl">
                         {['off', '24h', '7d'].map(opt => (
                             <button key={opt} onClick={() => toggleConvSetting('disappearing_messages', opt)} className="ctx-btn text-[9px] lowercase">{opt}</button>
                         ))}
                    </div>
                </button>
                <button className="ctx-btn"><Shield size={16} /> Verify encryption</button>
                <button className="ctx-btn text-red-500/80"><Ban size={16} /> Block user</button>
                <button onClick={clearChatHistory} className="ctx-btn text-red-500/80"><Trash size={16} /> Clear history</button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
          {lightboxImage && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10 cursor-zoom-out"
                onClick={() => setLightboxImage(null)}
              >
                  <img src={lightboxImage} className="max-w-full max-h-full rounded-2xl shadow-4xl" />
              </motion.div>
          )}
      </AnimatePresence>

      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .noise-bg { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3%3C/svg%3"); }
        .ctx-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1a1; transition: all 0.2s; }
        .ctx-btn:hover { background: rgba(255, 255, 255, 0.05); color: white; }
        .shadow-glow-green { box-shadow: 0 0 25px rgba(34, 197, 94, 0.2); }
        .silver-glow:focus { box-shadow: 0 0 15px rgba(192, 192, 192, 0.05); border-color: rgba(255, 255, 255, 0.2); }
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}
