"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, AtSign, FileText, Rocket } from 'lucide-react'

export default function Onboarding() {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [currentlyBuilding, setCurrentlyBuilding] = useState('')
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!supabase) return

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      
      // Auto-fill from GitHub if available
      setDisplayName(user.user_metadata.full_name || '')
      setUsername(user.user_metadata.user_name || '')
    }
    checkUser()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || loading) return

    setLoading(true)
    try {
      const { error } = await supabase.from('users').insert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: displayName,
        bio,
        currently_building: currentlyBuilding,
        avatar_url: user.user_metadata.avatar_url,
        github_username: user.user_metadata.user_name,
      })

      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-20 flex justify-center">
      <div className="w-full max-w-md glass-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl border border-silver flex items-center justify-center bg-[#111] mb-4 silver-glow">
            <span className="text-sm font-bold text-silver">Ag</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to Argentum</h1>
          <p className="text-sm text-gray-500 mt-2">Let's set up your builder profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <AtSign size={14} />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="johndoe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <User size={14} />
              <span>Display Name</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} />
              <span>Bio</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors min-h-[80px]"
              placeholder="Building the future of..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Rocket size={14} />
              <span>Currently Building</span>
            </label>
            <input
              type="text"
              value={currentlyBuilding}
              onChange={(e) => setCurrentlyBuilding(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Argentum, a proof-of-work protocol"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-accent/90 transition-all shadow-lg mt-4 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}
