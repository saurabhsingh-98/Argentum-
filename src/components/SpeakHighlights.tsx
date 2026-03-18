"use client"

import { Zap, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getGradientFromUsername } from '@/lib/utils/ui'

interface Highlight {
  id: string
  title: string
  content: string
  users: {
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function SpeakHighlights({ highlights }: { highlights: Highlight[] }) {
  if (!highlights || highlights.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Zap size={14} className="text-black" fill="currentColor" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500">Broadcast Highlights</h3>
        </div>
        <Link href="/feed?category=Speak" className="text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1">
          View All <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
        {highlights.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-80 group"
          >
            <Link href={`/post/${item.id}`}>
              <div className="h-full bg-card border border-amber-500/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden">
                {/* Glow behind */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none group-hover:bg-amber-500/10 transition-all" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center overflow-hidden"
                      style={{ background: item.users.avatar_url ? 'none' : getGradientFromUsername(item.users.username) }}
                    >
                      {item.users.avatar_url ? (
                        <img src={item.users.avatar_url} alt="av" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-foreground">{item.users.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-foreground line-clamp-1">@{item.users.username}</span>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                     <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic">Broadcast</span>
                  </div>
                </div>

                <h4 className="text-sm font-black text-foreground mb-2 line-clamp-1 group-hover:text-amber-500 transition-colors">
                  {item.title.replace('Broadcast: ', '')}
                </h4>
                <p className="text-[11px] text-foreground/40 line-clamp-2 leading-relaxed">
                  {item.content.replace(/[#*`]/g, '')}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
