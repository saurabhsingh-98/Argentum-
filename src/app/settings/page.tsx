"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, AtSign, FileText, Rocket, Github, Twitter, Globe, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Form State
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [currentlyBuilding, setCurrentlyBuilding] = useState('')
  const [githubUsername, setGithubUsername] = useState('')
  const [twitterUsername, setTwitterUsername] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        setDisplayName(profile.display_name || '')
        setBio(profile.bio || '')
        setCurrentlyBuilding(profile.currently_building || '')
        setGithubUsername(profile.github_username || '')
        setTwitterUsername(profile.x_handle || '')
        setWebsiteUrl(profile.website_url || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [supabase, router])

  // Real-time username check (only if changed from original)
  useEffect(() => {
    if (!username || username.length < 3) {
        setUsernameStatus('idle')
        return
    }

    const checkAvailability = async () => {
      if (username === user?.user_metadata?.username) {
          setUsernameStatus('available')
          return
      }

      setUsernameStatus('checking')
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .neq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        setUsernameStatus('available')
      } else {
        setUsernameStatus('taken')
      }
    }

    const timer = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timer)
  }, [username, user, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || saving) return
    if (username.length < 3) {
        setStatus({ type: 'error', message: 'Username must be at least 3 characters.' })
        return
    }

    setSaving(true)
    setStatus(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: username.toLowerCase(),
          display_name: displayName,
          bio,
          currently_building: currentlyBuilding,
          github_username: githubUsername,
          x_handle: twitterUsername,
          website_url: websiteUrl,
        })
        .eq('id', user.id)

      if (error) throw error
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' })
      setTimeout(() => setStatus(null), 3000)
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
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
    <div className="min-h-screen bg-[#050505] py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link 
          href={`/profile/${username}`} 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Profile</span>
        </Link>

        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-3xl font-bold text-white tracking-tight">Profile Settings</h1>
          <p className="text-gray-500">Customize how you appear in the Argentum protocol.</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          {/* Basic Info Section */}
          <div className="glass-card p-8 flex flex-col gap-6">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Identity</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    maxLength={30}
                    className={`w-full bg-[#0d0d0d] border rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-all ${
                      usernameStatus === 'taken' ? 'border-red-500/50' : 'border-white/5 focus:border-silver/40'
                    }`}
                  />
                  {usernameStatus === 'checking' && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 animate-spin" />}
                  {usernameStatus === 'taken' && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
                </div>
                {usernameStatus === 'taken' && <span className="text-[9px] text-red-500 font-bold uppercase ml-1">Username taken</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Bio</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-gray-600" size={14} />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all resize-none"
                  placeholder="Tell the world what you're building..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Currently Building</label>
              <div className="relative">
                <Rocket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                <input
                  type="text"
                  value={currentlyBuilding}
                  onChange={(e) => setCurrentlyBuilding(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                  placeholder="The next great protocol..."
                />
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="glass-card p-8 flex flex-col gap-6">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Connectivity</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">GitHub Username</label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">X / Twitter Handle <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                <div className="relative">
                  <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="text"
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {status && (
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {status.message}
              </div>
            )}
            
            <button
              type="submit"
              disabled={saving || usernameStatus === 'taken'}
              className="ml-auto silver-metallic px-8 py-4 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .silver-metallic {
          background: linear-gradient(135deg, #e5e5e5 0%, #ffffff 50%, #e5e5e5 100%);
          color: #000;
          text-shadow: 0 1px 0 rgba(255,255,255,0.5);
        }
        .shadow-glow {
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        .shadow-glow:hover {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
