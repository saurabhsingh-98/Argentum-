'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Check, Clock } from 'lucide-react'

interface CollabApplyButtonProps {
  postId: string
  isCollab: boolean
  postAuthorId: string
  currentUserId: string | null
}

export default function CollabApplyButton({
  postId,
  isCollab,
  postAuthorId,
  currentUserId,
}: CollabApplyButtonProps) {
  const supabase = createClient() as any
  const [status, setStatus] = useState<'none' | 'pending' | 'accepted' | 'declined' | 'loading'>('loading')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isCollab || !currentUserId || currentUserId === postAuthorId) return

    const fetchRequest = async () => {
      const { data } = await supabase
        .from('collab_requests')
        .select('status')
        .eq('post_id', postId)
        .eq('applicant_id', currentUserId)
        .single()

      setStatus(data ? data.status : 'none')
    }

    fetchRequest()
  }, [postId, currentUserId, postAuthorId, isCollab])

  if (!isCollab || !currentUserId || currentUserId === postAuthorId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/collab/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, message: message.trim() || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setSubmitting(false)
      return
    }

    setStatus('pending')
    setShowForm(false)
    setMessage('')
    setSubmitting(false)
  }

  if (status === 'loading') return null

  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold">
        <Check size={14} />
        Accepted ✓
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-bold cursor-not-allowed">
        <Clock size={14} />
        Application Pending
      </div>
    )
  }

  if (status === 'declined') return null

  return (
    <div className="flex flex-col gap-3">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/20 transition-all"
        >
          <Users size={14} />
          Apply to Collaborate
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message to the author…"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 resize-none focus:outline-none focus:border-accent/40"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent" />
              ) : (
                'Send Application'
              )}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
