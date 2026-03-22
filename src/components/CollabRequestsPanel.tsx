'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Check, X, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { getGradientFromUsername, getInitials } from '@/lib/utils/ui'

interface CollabRequest {
  id: string
  applicant_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined'
  users: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface CollabRequestsPanelProps {
  postId: string
  currentUserId: string | null
  postAuthorId: string
}

export default function CollabRequestsPanel({
  postId,
  currentUserId,
  postAuthorId,
}: CollabRequestsPanelProps) {
  const supabase = createClient() as any
  const [requests, setRequests] = useState<CollabRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (currentUserId !== postAuthorId) return

    const fetchRequests = async () => {
      const { data } = await supabase
        .from('collab_requests')
        .select('id, applicant_id, message, status, users(username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      setRequests(data || [])
      setLoading(false)
    }

    fetchRequests()
  }, [postId, currentUserId, postAuthorId])

  if (currentUserId !== postAuthorId) return null

  const handleRespond = async (requestId: string, action: 'accepted' | 'declined') => {
    setActionLoading(requestId)

    const res = await fetch('/api/collab/respond', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })

    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: action } : r))
      )
    }

    setActionLoading(null)
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const otherRequests = requests.filter((r) => r.status !== 'pending')

  if (loading) return null

  if (requests.length === 0) {
    return (
      <div className="glass-card p-6 border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-accent" size={18} />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Collab Requests</h3>
        </div>
        <p className="text-xs text-gray-500 italic">No collaboration requests yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 border-white/5">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-accent" size={18} />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Collab Requests</h3>
        {pendingRequests.length > 0 && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black">
            {pendingRequests.length} pending
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {[...pendingRequests, ...otherRequests].map((request) => (
          <div key={request.id} className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white overflow-hidden border border-white/10 flex-shrink-0"
                style={{
                  background: request.users?.avatar_url
                    ? 'none'
                    : getGradientFromUsername(request.users?.username || 'u'),
                }}
              >
                {request.users?.avatar_url ? (
                  <img src={request.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(request.users?.display_name || null, request.users?.username || 'U')
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <Link
                  href={`/profile/${request.users?.username}`}
                  className="text-xs font-bold text-white hover:text-accent transition-colors truncate"
                >
                  {request.users?.display_name || request.users?.username}
                </Link>
                <span className="text-[10px] text-gray-500 font-mono">@{request.users?.username}</span>
              </div>

              {request.status !== 'pending' && (
                <span
                  className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    request.status === 'accepted'
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {request.status}
                </span>
              )}
            </div>

            {request.message && (
              <p className="text-xs text-gray-400 italic leading-relaxed pl-11">
                "{request.message}"
              </p>
            )}

            {request.status === 'pending' && (
              <div className="flex items-center gap-2 pl-11">
                <button
                  onClick={() => handleRespond(request.id, 'accepted')}
                  disabled={actionLoading === request.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold hover:bg-green-500/20 transition-all disabled:opacity-50"
                >
                  <Check size={12} />
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(request.id, 'declined')}
                  disabled={actionLoading === request.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <X size={12} />
                  Decline
                </button>
                <Link
                  href={`/messages?user=${request.applicant_id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold hover:bg-white/10 transition-all"
                >
                  <MessageSquare size={12} />
                  Message
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
