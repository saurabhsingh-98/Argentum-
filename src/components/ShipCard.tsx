"use client"

import { useState } from 'react'
import { Send, Zap, Activity, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ShipCard() {
  const [content, setContent] = useState('')
  const [isShipping, setIsShipping] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleShip = async () => {
    if (!content.trim()) return
    
    setIsShipping(true)
    if (!supabase) {
      alert("System offline: API Keys missing.")
      setIsShipping(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert("Please sign in to ship a build log!")
      setIsShipping(false)
      return
    }

    // Quick ship logic (using title as the content capture or a default)
    const { error } = await supabase.from('posts').insert({
      title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      content: content,
      category: 'Other',
      user_id: user.id,
      status: 'published'
    })

    if (error) {
      console.error(error)
      alert("Shipping failed. Try again!")
    } else {
      setContent('')
      // Atomic Feedback: Trigger a "Streak Extended" event
      console.log("Streak Extended!")
      router.refresh()
    }
    setIsShipping(false)
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-4 border border-border bg-card relative overflow-hidden group">
      {/* Scientific Decoration */}
      <div className="absolute top-2 right-4 text-[9px] font-mono text-foreground/5 select-none">
        PROT_LOG_v2.0 // SHIP_SEQUENCE
      </div>
      
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center shrink-0 text-foreground group-hover:silver-glow transition-all duration-500">
           <Zap size={20} className="animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-foreground tracking-tight">What are you shipping?</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you build today?"
              className="w-full bg-transparent border-none text-[13px] text-foreground placeholder:text-foreground/20 focus:ring-0 p-0 resize-none min-h-[60px]"
            />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-4 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
            <div className="flex items-center gap-1.5 hover:text-foreground/60 cursor-default transition-colors">
                <Activity size={10} />
                <span>Sync Active</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-foreground/60 cursor-default transition-colors">
                <Clock size={10} />
                <span>UTC {new Date().getHours()}:00</span>
            </div>
        </div>
        
        <button
          onClick={handleShip}
          disabled={!content.trim() || isShipping}
          className={`
            flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
            ${content.trim() 
              ? 'silver-metallic shadow-glow hover:brightness-110 active:scale-95' 
              : 'bg-foreground/5 text-foreground/20 cursor-not-allowed border border-border'
            }
          `}
        >
          {isShipping ? 'Shipping...' : 'Ship It'}
          <Send size={12} className={content.trim() ? 'animate-bounce' : ''} />
        </button>
      </div>

      <style jsx>{`
        textarea::placeholder {
          font-style: italic;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
