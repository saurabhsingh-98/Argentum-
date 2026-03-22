"use client"

import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

interface EmojiPickerProps {
  visible: boolean
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ visible, onSelect, onClose }: EmojiPickerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full mb-2 left-0 z-[200] flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-card border border-border shadow-2xl"
          onMouseLeave={onClose}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose(); }}
              className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-bg-surface"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
