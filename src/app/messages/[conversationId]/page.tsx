"use client"

import { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, ArrowLeft, Loader2, Lock, ShieldCheck, User } from 'lucide-react'
import Link from 'next/link'
import { decryptMessage, encryptMessage, getStoredSecretKey, initializeEncryption } from '@/lib/crypto'

export default function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

      // Fetch conversation details
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:users!conversations_participant_1_fkey(id, username, display_name, avatar_url, public_key),
          participant_2_profile:users!conversations_participant_2_fkey(id, username, display_name, avatar_url, public_key)
        `)
        .eq('id', conversationId)
        .single()

      if (convError || !conv) {
        console.error('Conversation not found')
        router.push('/messages')
        return
      }

      if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
        console.error('Unauthorized access')
        router.push('/messages')
        return
      }

      setConversation(conv)
      setOtherParticipant(conv.participant_1 === user.id ? conv.participant_2_profile : conv.participant_1_profile)

      // Initial messages fetch
      await fetchMessages(conv, user.id)
      setLoading(false)
      scrollToBottom()

      // Subscribe to real-time updates
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload: any) => {
            const secretKey = getStoredSecretKey()
            if (!secretKey) {
                setMessages(prev => [...prev, { ...payload.new, decryptedContent: "Encrypted message" }])
                scrollToBottom()
                return
            }

            const senderProfile = conv.participant_1 === payload.new.sender_id 
              ? conv.participant_1_profile 
              : conv.participant_2_profile

            const decrypted = decryptMessage(payload.new.content, senderProfile.public_key, secretKey)
            setMessages(prev => [...prev, { ...payload.new, decryptedContent: decrypted || "Encrypted message" }])
            setTimeout(scrollToBottom, 100)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setup()
  }, [conversationId])

  const fetchMessages = async (conv: any, userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return
    }

    const secretKey = getStoredSecretKey()
    const processedMessages = data.map((msg: any) => {
      if (!secretKey) return { ...msg, decryptedContent: "Encrypted message" }

      const senderProfile = conv.participant_1 === msg.sender_id 
        ? conv.participant_1_profile 
        : conv.participant_2_profile

      const decrypted = decryptMessage(msg.content, senderProfile.public_key, secretKey)
      return {
        ...msg,
        decryptedContent: decrypted || "Encrypted message"
      }
    })

    setMessages(processedMessages)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !otherParticipant || !conversation) return

    if (!otherParticipant.public_key) {
      alert("This user hasn't set up encryption yet. They need to log in to generate their keys.")
      return
    }

    const secretKey = getStoredSecretKey()
    if (!secretKey) {
      alert("Encryption keys are not set up on this device. You cannot send messages.")
      return
    }

    setSending(true)

    try {
      const encryptedContent = encryptMessage(
        newMessage,
        otherParticipant.public_key,
        secretKey
      )

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: encryptedContent
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  const groupedMessages = messages.reduce((groups: any, message) => {
    const date = new Date(message.created_at).toLocaleDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/messages" className="p-2 hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-[#111] flex items-center justify-center">
              {otherParticipant.avatar_url ? (
                <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-gray-600" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-sm tracking-tight">{otherParticipant.display_name || `@${otherParticipant.username}`}</h2>
              <div className="flex items-center gap-1">
                <ShieldCheck size={10} className="text-green-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">E2E Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            {msgs.map((msg: any) => {
              const isOwn = msg.sender_id === currentUser.id
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isOwn 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                        : 'bg-white/5 border border-white/10 text-gray-200'
                    }`}>
                      {msg.decryptedContent === "Encrypted message" && !isOwn && (
                         <div className="flex items-center gap-2 text-orange-500/70 mb-1">
                            <Lock size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Cannot Decrypt</span>
                         </div>
                      )}
                      {msg.decryptedContent}
                    </div>
                    <div className={`mt-1 flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0d0d0d] border-t border-white/5">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={otherParticipant.public_key ? "Type an encrypted message..." : "Cannot send message..."}
            disabled={!otherParticipant.public_key || encryptionStatus === 'missing_private_key'}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !otherParticipant.public_key || encryptionStatus === 'missing_private_key'}
            className="w-12 h-12 rounded-xl silver-metallic flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
        {!otherParticipant.public_key && (
          <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-3 text-center">
            ⚠️ This user hasn't set up encryption yet
          </p>
        )}
        {encryptionStatus === 'missing_private_key' && (
           <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-3 text-center">
            ⚠️ Private key missing on this device
          </p>
        )}
      </div>
    </div>
  )
}
