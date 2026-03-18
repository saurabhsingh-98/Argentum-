"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, AtSign, User, FileText, Rocket, Github, Twitter, Instagram, Globe, Save, Loader2, AlertCircle, CheckCircle2, Lock, Globe2, Search, Briefcase, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: any
  onUpdate: (updatedProfile: any) => void
}

export default function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(profile.username || '')
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [currentlyBuilding, setCurrentlyBuilding] = useState(profile.currently_building || '')
  const [githubUsername, setGithubUsername] = useState(profile.github_username || '')
  const [twitterUsername, setTwitterUsername] = useState(profile.twitter_username || '')
  const [instagramUsername, setInstagramUsername] = useState(profile.instagram_username || '')
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '')
  const [isPublic, setIsPublic] = useState(profile.is_public !== false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [skills, setSkills] = useState(profile.skills?.join(', ') || '')
  const [isOpenToWork, setIsOpenToWork] = useState(profile.open_to_work || false)
  const [lookingFor, setLookingFor] = useState(profile.looking_for || '')
  
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Real-time username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    if (username === profile.username) {
      setUsernameStatus('available')
      return
    }

    const checkAvailability = async () => {
      setUsernameStatus('checking')
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .neq('id', profile.id)
        .single()

      if (error && error.code === 'PGRST116') {
        setUsernameStatus('available')
      } else {
        setUsernameStatus('taken')
      }
    }

    const timer = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timer)
  }, [username, profile.username, profile.id, supabase])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setStatus({ type: 'error', message: 'Error uploading image.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || usernameStatus === 'taken') return

    setLoading(true)
    setStatus(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: username.toLowerCase(),
          display_name: displayName,
          bio: bio || null,
          currently_building: currentlyBuilding || null,
          github_username: githubUsername || null,
          twitter_username: twitterUsername || null,
          instagram_username: instagramUsername || null,
          website_url: websiteUrl || null,
          is_public: isPublic,
          avatar_url: avatarUrl,
          skills: skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== ''),
          open_to_work: isOpenToWork,
          looking_for: lookingFor || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      onUpdate({
        ...profile,
        username: username.toLowerCase(),
        display_name: displayName,
        bio: bio || null,
        currently_building: currentlyBuilding || null,
        github_username: githubUsername || null,
        twitter_username: twitterUsername || null,
        instagram_username: instagramUsername || null,
        website_url: websiteUrl || null,
        is_public: isPublic,
        avatar_url: avatarUrl,
        skills: skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== ''),
        open_to_work: isOpenToWork,
        looking_for: lookingFor || null,
      })

      setStatus({ type: 'success', message: 'Profile updated!' })
      setTimeout(() => {
        onClose()
        setStatus(null)
      }, 1000)
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0d0d0d]">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
              </div>
              <button
                onClick={handleSave}
                disabled={loading || usernameStatus === 'taken'}
                className="silver-metallic px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[70vh] overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
              {/* Avatar Section */}
              <div className="relative group self-center">
                <div className="w-32 h-32 rounded-3xl border-2 border-silver/20 bg-[#111] overflow-hidden relative flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white uppercase">{username[0]}</span>
                  )}
                  <div 
                    onClick={handleAvatarClick}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                  >
                    <Camera size={32} className="text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Fields */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your full name or preferred name"
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                        className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none transition-all ${
                          usernameStatus === 'taken' ? 'border-red-500/50' : 'border-white/5 focus:border-silver/40'
                        }`}
                        placeholder="yourhandle"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 size={14} className="animate-spin text-gray-600" />}
                        {usernameStatus === 'available' && <CheckCircle2 size={14} className="text-green-500" />}
                        {usernameStatus === 'taken' && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio & Current Work */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Bio <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-gray-600" size={14} />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell us what you're shipping..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Currently Building <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                  <div className="relative">
                    <Rocket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                    <input
                      type="text"
                      value={currentlyBuilding}
                      onChange={(e) => setCurrentlyBuilding(e.target.value)}
                      placeholder="Project Alpha..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-silver/40 transition-all"
                    />
                  </div>
                </div>

                {/* Socials */}
                {/* Socials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">GitHub <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                    <div className="relative">
                      <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="yourhandle"
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-silver/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">X / Twitter <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                    <div className="relative">
                      <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input
                        type="text"
                        value={twitterUsername}
                        onChange={(e) => setTwitterUsername(e.target.value)}
                        placeholder="yourhandle"
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-silver/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instagram <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                    <div className="relative">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input
                        type="text"
                        value={instagramUsername}
                        onChange={(e) => setInstagramUsername(e.target.value)}
                        placeholder="yourhandle"
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-silver/40 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Website <span className="text-gray-700 font-normal lowercase">(Optional)</span></label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-silver/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Profile Visibility</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setIsPublic(true)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isPublic 
                          ? 'bg-green-500/5 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] scale-[1.02]' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Globe2 size={18} className={isPublic ? 'text-green-500' : 'text-gray-400'} />
                        <span className={`text-sm font-bold ${isPublic ? 'text-green-500' : 'text-white'}`}>Public</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">Anyone can view your profile and builds</p>
                    </div>

                    <div 
                      onClick={() => setIsPublic(false)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        !isPublic 
                          ? 'bg-green-500/5 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] scale-[1.02]' 
                          : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Lock size={18} className={!isPublic ? 'text-green-500' : 'text-gray-400'} />
                        <span className={`text-sm font-bold ${!isPublic ? 'text-green-500' : 'text-white'}`}>Private</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">Only you can see your profile</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer / Status */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`px-8 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                    status.type === 'success' ? 'text-green-500 bg-green-500/5' : 'text-red-500 bg-red-500/5'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {status.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
