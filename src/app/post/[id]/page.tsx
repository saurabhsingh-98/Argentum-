"use client"

import { createClient } from '@/lib/supabase/client'
import { notFound, useRouter } from 'next/navigation'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import ReactionButton from '@/components/ReactionButton'
import CommentsSection from '@/components/CommentsSection'
import ReportModal from '@/components/ReportModal'
import { Calendar, Hash, ShieldCheck, Tag, User, Flag, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'

export default function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [post, setPost] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: postData }, { data: { user } }] = await Promise.all([
        supabase
          .from('posts')
          .select('*, users(id, username, display_name, avatar_url, bio, currently_building, twitter_username)')
          .eq('id', id)
          .single(),
        supabase.auth.getUser()
      ])

      if (!postData) return notFound()
      
      setPost(postData)
      setCurrentUser(user)
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>
  )

  if (!post) return notFound()

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
       <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back to Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar size={14} />
                <span>{new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag size={14} />
                <span className="text-accent font-bold uppercase tracking-wider text-[10px]">{post.category}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 bg-[#0d0d0d] relative group">
             {!currentUser || currentUser.id !== post.user_id ? (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-red-500 hover:border-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                  title="Report Post"
                >
                  <Flag size={16} />
                </button>
             ) : null}
            <MarkdownRenderer source={post.content} />
          </div>

          {/* Comments Section */}
          <CommentsSection 
            postId={post.id} 
            postOwnerId={post.user_id} 
            currentUserId={currentUser?.id} 
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Action Card */}
          <div className="glass-card p-8 flex flex-col gap-6 bg-gradient-to-br from-white/[0.03] to-transparent border-white/10">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Support this Build</span>
              <ReactionButton 
                postId={post.id} 
                currentUserId={currentUser?.id} 
              />
            </div>
          </div>

          {/* Verification Panel */}
          <div className="glass-card p-6 border-accent/20 bg-accent/[0.02]">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="text-accent" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Verification</h3>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 font-mono">
                <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5">
                    <Hash size={10} />
                    Content Hash (SHA-256)
                </span>
                <span className="text-xs text-white break-all p-2 bg-white/5 rounded-lg border border-white/5">
                  {post.content_hash || 'UNHASHED'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">HCS Sequence</span>
                <span className="text-gray-700 italic">Confirmed</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">NFT Token</span>
                <span className="text-gray-700 italic">Coming Soon</span>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  post.verification_status === 'verified' 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-white/5 text-gray-500'
                }`}>
                  {post.verification_status}
                </span>
              </div>
            </div>
          </div>

          {/* Author Card */}
          <div className="glass-card p-6">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 block">Builder</span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-silver/20 bg-[#111] overflow-hidden flex items-center justify-center font-bold text-white">
                {post.users.avatar_url ? (
                  <img src={post.users.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  post.users.username[0].toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <Link href={`/profile/${post.users.username}`} className="font-bold text-white hover:text-accent transition-colors">
                  {post.users.display_name || post.users.username}
                </Link>
                <span className="text-xs text-gray-500 font-mono">@{post.users.username}</span>
              </div>
            </div>
            {post.users.bio && (
                <p className="text-xs text-gray-400 mt-4 leading-relaxed line-clamp-3 italic">
                    "{post.users.bio}"
                </p>
            )}
            {post.users.currently_building && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-gray-600 uppercase block mb-1">Building</span>
                    <span className="text-xs text-accent italic">"{post.users.currently_building}"</span>
                </div>
            )}
          </div>
        </div>
      </div>

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        postId={post.id}
        currentUserId={currentUser?.id}
      />
    </div>
  )
}
