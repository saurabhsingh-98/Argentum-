'use client'

import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'

type DisappearingOption = 'off' | '24h' | '7d'

interface DisappearingMessageSettingsProps {
  conversationId: string
  currentSetting: DisappearingOption
  onSettingChange: (setting: DisappearingOption) => void
}

const OPTIONS: { value: DisappearingOption; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
]

export default function DisappearingMessageSettings({
  conversationId,
  currentSetting,
  onSettingChange,
}: DisappearingMessageSettingsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = async (value: DisappearingOption) => {
    if (value === currentSetting) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch('/api/messages/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, disappearingMessages: value }),
      })
      if (res.ok) onSettingChange(value)
    } catch (err) {
      console.error('Failed to update disappearing messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentLabel = OPTIONS.find(o => o.value === currentSetting)?.label || 'Off'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50"
      >
        <Clock size={12} />
        {loading ? 'Updating…' : currentLabel}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-xl shadow-2xl z-50 p-1">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                opt.value === currentSetting
                  ? 'text-accent bg-accent/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
