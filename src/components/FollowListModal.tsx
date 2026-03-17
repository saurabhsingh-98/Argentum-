"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Loader2, UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getGradientFromUsername, getInitials } from '@/lib/utils/ui'
import FollowButton from './FollowButton'
import { motion, AnimatePresence } from 'framer-motion'

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  username: string
  initialTab: 'followers' | 'following'
}

export default function FollowListModal({ isOpen, onClose, userId, username, initialTab }: FollowListModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const observer = useRef<IntersectionObserver | null>(null)
  const lastUserRef = useCallback((node: any) => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore])

  const supabase = createClient()

  const fetchUsers = async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 0 : page
    const start = currentPage * 20
    const end = start + 19

    try {
      let query;
      if (activeTab === 'followers') {
        query = supabase
          .from('follows')
          .select('id, follower:follower_id(*)', { count: 'exact' })
          .eq('following_id', userId)
          .range(start, end)
      } else {
        query = supabase
          .from('follows')
          .select('id, following:following_id(*)', { count: 'exact' })
          .eq('follower_id', userId)
          .range(start, end)
      }

      const { data, count, error } = await query

      if (error) throw error

      const formattedUsers = data?.map((item: any) => activeTab === 'followers' ? item.follower : item.following) || []
      
      const filteredUsers = formattedUsers.filter((u: any) => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )

      if (reset) {
        setUsers(filteredUsers)
      } else {
        setUsers(prev => [...prev, ...filteredUsers])
      }
      
      setTotalCount(count || 0)
      setHasMore(formattedUsers.length === 20)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setPage(0)
      setHasMore(true)
      fetchUsers(true)
    }
  }, [isOpen, activeTab, userId])

  useEffect(() => {
    if (page > 0) {
      fetchUsers()
    }
  }, [page])

  // Simple client-side search for the current loaded list, but ideally we'd search the DB
  // For now, let's keep it simple or implement a debounce for DB search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        setPage(0)
        fetchUsers(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">
              {activeTab === 'followers' ? `Followers (${totalCount})` : `Following (${totalCount})`}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'followers' ? 'text-white border-b-2 border-white bg-white/5' : 'text-gray-500 hover:text-white'}`}
            >
              Followers
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'following' ? 'text-white border-b-2 border-white bg-white/5' : 'text-gray-500 hover:text-white'}`}
            >
              Following
            </button>
          </div>

          {/* Search */}
          <div className="p-4 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {users.length > 0 ? (
              users.map((user, index) => (
                <div 
                  key={user.id}
                  ref={index === users.length - 1 ? lastUserRef : null}
                  className="p-3 flex items-center justify-between hover:bg-white/[0.03] rounded-xl transition-all group"
                >
                  <Link 
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 overflow-hidden flex-1"
                  >
                    <div 
                      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border border-white/10"
                      style={{ background: getGradientFromUsername(user.username) }}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-xs font-black text-white">{getInitials(user.display_name, user.username)}</span>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{user.display_name || user.username}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 truncate">@{user.username}</span>
                      {user.bio && (
                        <p className="text-[10px] text-gray-600 truncate mt-0.5">{user.bio}</p>
                      )}
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {user.skills.slice(0, 2).map((skill: string) => (
                            <span key={skill} className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-gray-400 capitalize whitespace-nowrap">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>

                  <FollowButton 
                    followingId={user.id}
                    initialIsFollowing={true} // This is slightly tricky, we'd need to know if the CURRENT user follows this user
                    // For the "Following" tab, it's true if we are looking at OUR OWN following list.
                    // But if we are looking at someone else's list, we don't know.
                    // Let's rely on FollowButton's internal state which usually fetches or is passed.
                    className="px-4 py-1.5 !rounded-xl"
                  />
                </div>
              ))
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-20">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <UserCircle2 size={24} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">
                  {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </p>
              </div>
            )}
            {loading && users.length > 0 && (
              <div className="py-4 flex justify-center">
                <Loader2 size={16} className="animate-spin text-gray-600" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
