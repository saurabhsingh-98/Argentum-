"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { decryptMessage, getStoredSecretKey, initializeEncryption } from '@/lib/crypto'

export default function MessagesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [encryptionStatus, setEncryptionStatus] = useState<string>('loading')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const status = await initializeEncryption()
      setEncryptionStatus(status?.status || 'ready')

      fetchConversations(user.id)
    }

    checkAuth()
  }, [])

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

        let decryptedContent = "No messages yet"
        if (lastMessage) {
          if (secretKey) {
            const senderPublicKey = lastMessage.sender_id === userId 
              ? conv.participant_1 === userId ? conv.participant_1_profile.public_key : conv.participant_2_profile.public_key
              : otherParticipant.public_key

            const decrypted = decryptMessage(lastMessage.content, senderPublicKey, secretKey)
            decryptedContent = decrypted || "Encrypted message"
          } else {
            decryptedContent = "Encrypted message"
          }
        }

        return {
          ...conv,
          otherParticipant,
          lastMessage: lastMessage ? { ...lastMessage, decryptedContent } : null
        }
      })

      setConversations(processedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-silver animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-silver/30 pb-20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-silver">
                <MessageCircle size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-black text-white tracking-tighter">Messages</h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">End-to-End Encrypted</p>
              </div>
            </div>
          </div>

          {encryptionStatus === 'missing_private_key' && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex flex-col gap-3">
              <p className="text-orange-500 text-sm font-bold">⚠️ Encryption keys not set up on this device</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Your private key is missing from this device. You will be able to send new messages, but you cannot decrypt previous messages sent to you.
              </p>
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="glass-card p-20 flex flex-col items-center text-center gap-6 mt-10">
              <div className="w-20 h-20 rounded-[2rem] border border-white/10 bg-[#0d0d0d] flex items-center justify-center text-gray-500">
                <MessageCircle size={32} />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-black text-white">No messages yet</h2>
                <p className="text-gray-500 text-sm">Start a conversation from someone's profile.</p>
              </div>
              <Link 
                href="/explore"
                className="mt-4 px-8 py-3 rounded-xl silver-metallic text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
              >
                Go to Explore
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {conversations.map((conv) => (
                <Link 
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="glass-card p-6 flex items-center gap-6 group hover:bg-white/[0.03] hover:border-white/20 transition-all active:scale-[0.99]"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden bg-[#0d0d0d] flex items-center justify-center group-hover:border-white/30 transition-all">
                      {conv.otherParticipant.avatar_url ? (
                        <img src={conv.otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-black text-silver">
                          {conv.otherParticipant.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || conv.otherParticipant.username?.[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-white group-hover:silver-glow-text transition-all truncate">
                        {conv.otherParticipant.display_name || `@${conv.otherParticipant.username}`}
                      </h3>
                      {conv.lastMessage && (
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                          {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage?.decryptedContent || "No messages yet"}
                      </p>
                      <span className="text-[10px] font-bold text-gray-700 truncate">
                         @{conv.otherParticipant.username}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
