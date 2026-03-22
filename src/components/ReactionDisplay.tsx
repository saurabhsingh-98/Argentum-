"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ReactionGroup {
  emoji: string
  count: number
  usernames: string[]
  reactedByMe: boolean
}

interface ReactionDisplayProps {
  reactions: ReactionGroup[]
  onToggle: (emoji: string) => void
}

export default function ReactionDisplay({ reactions, onToggle }: ReactionDisplayProps) {
  const [tooltip, setTooltip] = useState<string | null>(null)

  if (!reactions || reactions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => (
        <div key={r.emoji} className="relative">
          <button
            onClick={() => onToggle(r.emoji)}
            onMouseEnter={() => setTooltip(r.emoji)}
            onMouseLeave={() => setTooltip(null)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
              ${r.reactedByMe
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border text-text-secondary hover:border-border-accent'
              }`}
          >
            <span>{r.emoji}</span>
            <span className="font-bold text-[10px]">{r.count}</span>
          </button>

          <AnimatePresence>
            {tooltip === r.emoji && r.usernames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-[300] px-2 py-1 rounded-lg bg-card border border-border shadow-xl whitespace-nowrap"
              >
                <p className="text-[10px] text-text-secondary">
                  {r.usernames.slice(0, 5).join(', ')}
                  {r.usernames.length > 5 ? ` +${r.usernames.length - 5} more` : ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
