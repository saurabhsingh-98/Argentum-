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
  LogOut,
  Camera,
  Image as ImageIcon,
  File as FileIcon,
  ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import { decryptMessage, encryptMessage, getStoredSecretKey, initializeEncryption, resetKeys } from '@/lib/crypto'
import { motion, AnimatePresence } from 'framer-motion'
import AccountSwitcher from '@/components/AccountSwitcher'
import CameraCapture from '@/components/CameraCapture'
import Lightbox from '@/components/Lightbox'
import KeyBackupModal from '@/components/KeyBackupModal'
import KeyRecoveryModal from '@/components/KeyRecoveryModal'
import { ChatUser, MessageWithReactions, ConversationWithParticipants, MessageReaction } from '@/types/chat'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabase = createClient()

export default function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<MessageWithReactions[]>([])
  const [conversation, setConversation] = useState<ConversationWithParticipants | null>(null)
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<ChatUser | null>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')
  
  // Advanced Features State
  const [showMenu, setShowMenu] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [nickname, setNickname] = useState('')
  const [isEditingNickname, setIsEditingNickname] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msg: MessageWithReactions, isOwn: boolean } | null>(null)
  const [bgContextMenu, setBgContextMenu] = useState<{ x: number, y: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<MessageWithReactions | null>(null)
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Decryption function that doesn't depend on stale state
  const decryptContent = (content: string, isOwn: boolean, conv: ConversationWithParticipants, userId: string) => {
    if (content.startsWith('[IMAGE]:')) return content
    
    const secretKey = getStoredSecretKey()
    if (!secretKey) return "Encrypted message"

    const otherProfile = conv.participant_1 === userId ? conv.participant_2_profile : conv.participant_1_profile
    const senderProfile = conv.participant_1 === (isOwn ? userId : otherProfile.id) ? conv.participant_1_profile : conv.participant_2_profile
    const decryptionKey = isOwn ? otherProfile.public_key : senderProfile.public_key
    
    if (!decryptionKey) return "Encrypted message"

    return decryptMessage(content, decryptionKey, secretKey) || "Encrypted message"
  }

  const fetchMessages = async (conv: ConversationWithParticipants, userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, message_reactions(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) return

    const processedMessages = (data as (Database['public']['Tables']['messages']['Row'] & { message_reactions: MessageReaction[] })[]).map((msg): MessageWithReactions => ({
      ...msg,
      decryptedContent: decryptContent(msg.content, msg.sender_id === userId, conv, userId),
      expired: msg.expires_at ? new Date(msg.expires_at) < new Date() : false
    })).filter(Boolean)
    
    setMessages(processedMessages)
  }

  useEffect(() => {
    const setup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setCurrentUser(user)

        const status = await initializeEncryption()
        setEncryptionStatus(status?.status || 'ready')
        
        if (status?.status === 'needs_recovery') {
          setShowRecoveryModal(true)
        }

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

        const muted = localStorage.getItem(`muted_${conversationId}`) === 'true'
        setIsMuted(muted)
        const savedNickname = localStorage.getItem(`nickname_${other.id}`) || ''
        setNickname(savedNickname)

        await fetchMessages(conv, user.id)
        
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .is('read_at', null)

        const channel = supabase
          .channel(`messages:${conversationId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
            (payload: { new: Database['public']['Tables']['messages']['Row'] }) => {
              setMessages((prev) => {
                const msg = payload.new
                const processed: MessageWithReactions = {
                  ...msg,
                  decryptedContent: decryptContent(msg.content, msg.sender_id === (user?.id || ''), conv, user?.id || ''),
                  expired: msg.expires_at ? new Date(msg.expires_at) < new Date() : false
                }
                return [...prev, processed]
              })
              setTimeout(() => scrollToBottom(), 50)
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
            (payload: any) => {
              setMessages((prev: any[]) => prev.map(m => {
                if (m.id === payload.new.id) {
                  const msg = payload.new
                  return {
                    ...m,
                    ...msg,
                    decryptedContent: decryptContent(msg.content, msg.sender_id === (user?.id || ''), conv, user?.id || ''),
                    expired: msg.expires_at ? new Date(msg.expires_at) < new Date() : false
                  }
                }
                return m
              }))
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
            (payload: any) => {
              setMessages((prev: any[]) => prev.filter(m => m.id !== payload.old.id))
            }
          )
          .subscribe();

        const reactionsChannel = supabase
          .channel(`reactions:${conversationId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'message_reactions' },
            async (payload: { new: MessageReaction, old: MessageReaction }) => {
              const messageId = payload.new?.message_id || payload.old?.message_id;
              if (messageId) {
                  const { data: reactions } = await supabase
                    .from('message_reactions')
                    .select('*')
                    .eq('message_id', messageId);
                  
                  setMessages((prev: any[]) => prev.map(m => 
                      m.id === messageId ? { ...m, message_reactions: reactions || [] } : m
                  ));
              }
            }
          )
          .subscribe();

        setLoading(false)
        setTimeout(() => scrollToBottom('auto'), 100)
      } catch (err) {
        console.error('ChatPage critical error:', err)
        setLoading(false)
      }
    }

    setup()

    const interval = setInterval(() => {
        const now = new Date()
        setMessages((prev: any[]) => prev.map(msg => {
            if (msg.expires_at && new Date(msg.expires_at) < now && !msg.deleted_for?.includes(currentUser?.id)) {
                return { ...msg, expired: true }
            }
            return msg
        }))
    }, 30000)

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
      if (!editingId) setContextMenu(null)
      setBgContextMenu(null)
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
        document.removeEventListener('click', handleClickOutside)
        clearInterval(interval)
    }
  }, [conversationId])

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.decryptedContent?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages


  const toggleReaction = async (messageId: string, emoji: string) => {
      if (!currentUser) return;
      
      const { data: existing } = await supabase
          .from('message_reactions')
          .select('id')
          .eq('message_id', messageId)
          .eq('user_id', currentUser.id)
          .eq('emoji', emoji)
          .single();

      if (existing) {
          await supabase.from('message_reactions').delete().eq('id', existing.id);
      } else {
          await supabase.from('message_reactions').insert({
              message_id: messageId,
              user_id: currentUser.id,
              emoji: emoji
          });
      }
      setContextMenu(null);
  }

  const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string, attachmentData?: { url: string, type: string, name: string, size: number }) => {
    if (e) e.preventDefault()
    const content = contentOverride || newMessage
    if ((!content.trim() && !attachmentData) || sending || !otherParticipant || !conversation) return

     const secretKey = getStoredSecretKey()
    if (!secretKey && !content.startsWith('[IMAGE]:')) {
      if (encryptionStatus === 'needs_recovery') {
        setShowRecoveryModal(true)
      } else if (encryptionStatus === 'missing_private_key') {
        alert("This device doesn't have your encryption keys. Please set up backup on your original device.")
      } else {
        alert("Encryption keys missing. Please refresh or check your settings.")
      }
      return
    }

    setSending(true)

    try {
      let finalContent = content
      if (!content.startsWith('[IMAGE]:')) {
          finalContent = encryptMessage(content, otherParticipant.public_key!, secretKey!)
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
          sender_id: currentUser!.id,
          content: finalContent,
          expires_at: expiresAt,
          attachment_url: attachmentData?.url,
          attachment_type: attachmentData?.type,
          attachment_name: attachmentData?.name,
          attachment_size: attachmentData?.size
        })

      if (error) throw error
      setNewMessage('')
      setReplyTo(null)

      // Prompt for backup after first message if not set up
      const hasPrompted = localStorage.getItem('ag_backup_prompted') === 'true'
      if (!hasPrompted && conversation.participant_1 === currentUser?.id && messages.length === 0) {
        setShowBackupModal(true)
        localStorage.setItem('ag_backup_prompted', 'true')
      }
    } catch (err: any) {
      console.error('Message failed to send:', err)
      alert(`Message failed: ${err.message || 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File | Blob, type: 'image' | 'file') => {
      if (!file) return
      
      setUploading(true)
      setUploadProgress(10)

      try {
          const isBlob = file instanceof Blob && !(file instanceof File)
          const fileName = isBlob ? `camera_${Date.now()}.jpg` : (file as File).name
          const fileExt = fileName.split('.').pop()
          const storagePath = `${conversationId}/${Math.random()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
              .from('message-attachments')
              .upload(storagePath, file, {
                  cacheControl: '3600',
                  upsert: false
              })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
              .from('message-attachments')
              .getPublicUrl(storagePath)

          await handleSendMessage(
            undefined, 
            type === 'image' ? `[IMAGE]:${publicUrl}` : `[FILE]:${fileName}`,
            {
                url: publicUrl,
                type: type,
                name: fileName,
                size: file.size
            }
          )
          setFilePreview(null)
          setSelectedFile(null)
      } catch (err) {
          console.error(err)
          alert("Upload failed")
      } finally {
          setUploading(false)
          setUploadProgress(0)
      }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
          if (file.size > 10 * 1024 * 1024) return alert("Max 10MB")
          setSelectedFile(file)
          if (file.type.startsWith('image/')) {
              const reader = new FileReader()
              reader.onload = (re) => setFilePreview(re.target?.result as string)
              reader.readAsDataURL(file)
          }
      }
  }

  const handleContextMenu = (e: React.MouseEvent, msg: MessageWithReactions, isOwn: boolean) => {
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
          const encrypted = encryptMessage(editContent, otherParticipant.public_key!, secretKey)
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

  const deleteMessage = async (msg: MessageWithReactions, everyone: boolean) => {
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
          const deletedFor = [...(dbMsg?.deleted_for || []), currentUser!.id]
          await supabase.from('messages').update({ deleted_for: deletedFor }).eq('id', msg.id)
      }
      setContextMenu(null)
  }

  const setExpiry = async (msg: MessageWithReactions, time: string) => {
      const now = new Date()
      let expiresAt = null
      if (time === 'After viewing') expiresAt = now.toISOString()
      else if (time === '1 Day') now.setDate(now.getDate() + 1), expiresAt = now.toISOString()
      else if (time === '1 Week') now.setDate(now.getDate() + 7), expiresAt = now.toISOString()
      else if (time === 'Lifetime') expiresAt = null
      
      await supabase.from('messages').update({ expires_at: expiresAt }).eq('id', msg.id)
      setContextMenu(null)
  }

  const toggleConvSetting = async (key: string, value: string | boolean | null) => {
      await supabase.from('conversations').update({ [key]: value }).eq('id', conversationId)
      setBgContextMenu(null)
  }

  const clearChatHistory = async () => {
      if (!confirm("Are you sure you want to clear your chat history for this conversation? This only deletes it for you.")) return
      
      const msgIds = messages.map(m => m.id)
      for (const id of msgIds) {
          const { data: msg } = await supabase.from('messages').select('deleted_for').eq('id', id).single()
          const deletedFor = [...(msg?.deleted_for || []), currentUser!.id]
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative selection:bg-silver/30" onContextMenu={handleBgContextMenu}>
      <div className="noise-bg absolute inset-0 pointer-events-none opacity-[0.03]" />
      <div className="mesh-gradient-bg opacity-5 absolute inset-0 pointer-events-none" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-[60]"
        >
          <div className="flex items-center gap-4">
            <Link href="/messages" className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <ArrowLeft size={18} className="text-gray-400" />
            </Link>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfilePanel(true)}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full border border-border overflow-hidden bg-card flex items-center justify-center shadow-glow-sm">
                  {otherParticipant.avatar_url ? (
                    <img 
                      src={otherParticipant.avatar_url} 
                      alt="avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-black text-silver">${otherParticipant.username[0].toUpperCase()}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-sm font-black text-silver">{otherParticipant.username[0].toUpperCase()}</span>
                  )}
                </div>
                {otherParticipant.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
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
             <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-white/20"
                    />
                  </motion.div>
                )}
             </AnimatePresence>
             <button 
                onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery('') }}
                className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
              >
                {showSearch ? <X size={20} /> : <Search size={20} />}
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
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
              <div className="w-16 h-16 rounded-[2rem] border border-white/10 flex items-center justify-center text-gray-600">
                <Lock size={24} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 text-center px-10">
                {searchQuery ? "No messages found matching your search." : "Messages are end-to-end encrypted. No one else can read them."}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
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
                     <div className="w-8 h-8 rounded-full border border-white/5 overflow-hidden bg-[#111] flex-shrink-0 mb-5 flex items-center justify-center">
                        {otherParticipant.avatar_url ? (
                          <img 
                            src={otherParticipant.avatar_url} 
                            alt="avatar" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] font-black">${otherParticipant.username[0].toUpperCase()}</span>`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black">{otherParticipant.username[0].toUpperCase()}</div>
                        )}
                     </div>
                  )}
                  <div 
                    className={`max-w-[75%] md:max-w-[60%] group relative`}
                    onContextMenu={(e) => handleContextMenu(e, msg, isOwn)}
                  >
                    <div className={`relative px-4 py-3 text-sm leading-relaxed ${
                      isOwn 
                        ? 'silver-metallic text-[#050505] rounded-2xl rounded-br-none' 
                        : 'bg-[#1a1a1a] text-white rounded-2xl rounded-bl-none border border-white/5 shadow-xl'
                    } ${msg.expired ? 'opacity-30' : ''}`}>
                      {msg.expired ? (
                          <div className="flex items-center gap-2 italic">
                              <Clock size={14} /> This message has expired
                          </div>
                      ) : msg.attachment_url && msg.attachment_type === 'image' ? (
                          <div className="flex flex-col gap-2">
                              <img 
                                src={msg.attachment_url} 
                                alt="attachment" 
                                className="rounded-lg max-w-full cursor-zoom-in hover:brightness-110 transition-all border border-white/10 shadow-lg" 
                                onClick={() => setLightboxImage(msg.attachment_url || null)}
                              />
                              {msg.decryptedContent && !msg.decryptedContent.startsWith('[IMAGE]:') && (
                                  <div className="px-1 py-1">{msg.decryptedContent}</div>
                              )}
                          </div>
                      ) : msg.attachment_url && msg.attachment_type === 'file' ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                              <a 
                                href={msg.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group/file"
                              >
                                  <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover/file:bg-white/10 transition-colors">
                                      <FileIcon size={20} className={isOwn ? 'text-black/60' : 'text-blue-400'} />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-[10px] font-black uppercase opacity-60">Document</span>
                                      <span className="text-xs font-bold truncate">{msg.attachment_name || 'Generic File'}</span>
                                      <span className="text-[9px] opacity-40 font-mono">{(msg.attachment_size || 0) / 1024 > 0 ? ((msg.attachment_size || 0) / 1024).toFixed(1) : '0'} KB</span>
                                  </div>
                              </a>
                              {msg.decryptedContent && !msg.decryptedContent.startsWith('[FILE]:') && (
                                  <div className="px-1">{msg.decryptedContent}</div>
                              )}
                          </div>
                      ) : isImage ? (
                          <img 
                            src={imageUrl!} 
                            alt="attachment" 
                            className="rounded-lg max-w-full cursor-pointer hover:brightness-110 transition-all" 
                            onClick={() => setLightboxImage(imageUrl || null)}
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
                      
                      {msg.message_reactions && msg.message_reactions.length > 0 && (
                        <div className={`flex gap-1 mt-2 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {(Object.entries((msg.message_reactions || []).reduce((acc, r: MessageReaction) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)) as [string, number][]).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-bold"
                            >
                              <span>{emoji}</span>
                              {count > 1 && <span className="text-white/60">{count}</span>}
                            </button>
                          ))}
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
          {encryptionStatus === 'missing_private_key' && (
            <div className="mb-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={18} />
                <p className="text-xs text-red-500/80 font-medium">Encryption keys missing. Your messages are locked on this device.</p>
              </div>
              <button 
                onClick={async () => {
                   if (confirm("Resetting keys will make all existing messages unreadable on this device. Continue?")) {
                      await resetKeys();
                      window.location.reload();
                    }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
              >
                Reset Keys
              </button>
            </div>
          )}
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} 
                    className={`p-3 rounded-full transition-all ${showAttachmentMenu ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                      <Paperclip size={20} className={showAttachmentMenu ? 'rotate-45 transition-transform' : ''} />
                  </button>
                  
                  <AnimatePresence>
                      {showAttachmentMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full left-0 mb-4 w-48 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-3xl p-2 z-[200]"
                          >
                              <button type="button" onClick={() => { setIsCameraOpen(true); setShowAttachmentMenu(false); }} className="ctx-btn">
                                  <Camera size={16} /> Take Photo
                              </button>
                              <button type="button" onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click(); setShowAttachmentMenu(false); }} className="ctx-btn">
                                  <ImageIcon size={16} /> Images
                              </button>
                              <button type="button" onClick={() => { fileInputRef.current?.removeAttribute('accept'); fileInputRef.current?.click(); setShowAttachmentMenu(false); }} className="ctx-btn">
                                  <FileIcon size={16} /> Documents
                              </button>
                          </motion.div>
                      )}
                  </AnimatePresence>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={onFileSelect} />
              </div>
              
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
                   <Lock size={16} />
                </div>
                {filePreview ? (
                  <div className="w-full bg-[#1a1a1a] border border-silver/40 rounded-2xl p-2 flex items-center gap-4 animate-scale-in">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 relative group">
                          <img src={filePreview} className="w-full h-full object-cover" />
                          <button onClick={() => { setFilePreview(null); setSelectedFile(null); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X size={14}/></button>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-silver">Image Attachment</span>
                          <span className="text-xs text-gray-500 truncate">{selectedFile?.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => selectedFile && handleFileUpload(selectedFile, 'image')}
                        disabled={uploading}
                        className="px-6 py-2 silver-metallic rounded-xl text-[10px] font-black uppercase tracking-widest mr-2"
                      >
                          {uploading ? <Loader2 size={12} className="animate-spin" /> : 'Send'}
                      </button>
                  </div>
                ) : selectedFile ? (
                  <div className="w-full bg-[#1a1a1a] border border-blue-500/40 rounded-2xl p-3 flex items-center gap-4 animate-scale-in">
                      <div className="p-2 bg-white/5 rounded-lg border border-white/10"><FileIcon size={20} className="text-blue-400" /></div>
                      <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-blue-400">File Attachment</span>
                          <span className="text-xs text-gray-500 truncate">{selectedFile?.name} ({(selectedFile?.size || 0) / 1024 > 1024 ? ((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1) + ' MB' : ((selectedFile?.size || 0) / 1024).toFixed(1) + ' KB'})</span>
                      </div>
                      <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="p-2 text-gray-500 hover:text-white"><X size={16}/></button>
                      <button 
                        type="button" 
                        onClick={() => handleFileUpload(selectedFile, 'file')}
                        disabled={uploading}
                        className="px-6 py-2 bg-blue-600/20 border border-blue-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest mr-2 text-blue-400"
                      >
                          {uploading ? <Loader2 size={12} className="animate-spin" /> : 'Send'}
                      </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="w-full h-full">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Send a secure message..."
                      className="w-full h-full bg-[#1a1a1a] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-silver/40 focus:glow-silver transition-all"
                    />
                  </form>
                )}
              </div>

              <button
                type="button" // Change to button since form logic is nested or handled manually
                onClick={() => handleSendMessage()}
                disabled={(!newMessage.trim() && !selectedFile) || sending}
                className="w-14 h-14 rounded-full bg-[#22c55e] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-glow-green"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
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
                {contextMenu && !contextMenu.isOwn && (
                    <div className="flex justify-around p-2 border-b border-white/5 mb-1">
                        {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(e => <button key={e} onClick={() => toggleReaction(contextMenu.msg.id, e)} className="hover:scale-125 transition-all">{e}</button>)}
                    </div>
                )}
                <button onClick={() => { if (contextMenu) navigator.clipboard.writeText(contextMenu.msg.decryptedContent || ''); setContextMenu(null); }} className="ctx-btn"><Copy size={16} /> Copy text</button>
                {contextMenu && contextMenu.isOwn ? (
                    <>
                        {contextMenu && !contextMenu.msg.content.startsWith('[IMAGE]:') && (
                            <button onClick={() => { if (contextMenu) { setEditingId(contextMenu.msg.id); setEditContent(contextMenu.msg.decryptedContent || ''); } setContextMenu(null); }} className="ctx-btn">
                                <Pencil size={16} /> Edit message
                            </button>
                        )}
                        <button className="ctx-btn group relative">
                            <Clock size={16} /> Set expiry
                            <ChevronRight size={14} className="ml-auto opacity-50" />
                            <div className={`hidden group-hover:block absolute top-0 w-40 bg-[#0d0d0d] border border-white/10 rounded-xl p-1 shadow-2xl ${
                                (typeof window !== 'undefined' && contextMenu && contextMenu.x > window.innerWidth - 400) ? 'right-full mr-1' : 'left-full ml-1'
                            }`}>
                                {['After viewing', '1 Day', '1 Week', 'Lifetime'].map(opt => (
                                    <button key={opt} onClick={() => { if (contextMenu) setExpiry(contextMenu.msg, opt); }} className="ctx-btn text-[9px]">{opt}</button>
                                ))}
                            </div>
                        </button>
                        <button onClick={() => { if (contextMenu) deleteMessage(contextMenu.msg, false); }} className="ctx-btn"><Trash2 size={16} /> Delete for me</button>
                        <button onClick={() => { if (contextMenu) deleteMessage(contextMenu.msg, true); }} className="ctx-btn text-red-500/80"><Trash2 size={16} /> Delete for everyone</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => { if (contextMenu) setReplyTo(contextMenu.msg); setContextMenu(null); }} className="ctx-btn"><Reply size={16} /> Reply</button>
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
                    <div className={`hidden group-hover:block absolute top-0 w-40 bg-[#0d0d0d] border border-white/10 rounded-xl p-1 shadow-2xl ${
                        (typeof window !== 'undefined' && bgContextMenu && bgContextMenu.x > (window.innerWidth - 400)) ? 'right-full mr-1' : 'left-full ml-1'
                    }`}>
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

      <Lightbox 
        isOpen={!!lightboxImage} 
        onClose={() => setLightboxImage(null)} 
        imageUrl={lightboxImage} 
      />

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

      <CameraCapture 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(blob) => handleFileUpload(blob, 'image')}
      />

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
