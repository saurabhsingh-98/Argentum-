'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface MessageExpiryIndicatorProps {
  expiresAt: string | null
  children: React.ReactNode
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expired'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function MessageExpiryIndicator({ expiresAt, children }: MessageExpiryIndicatorProps) {
  const [expired, setExpired] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)

  useEffect(() => {
    if (!expiresAt) return

    const check = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now()
      if (remaining <= 0) {
        setExpired(true)
        setCountdown(null)
      } else {
        setCountdown(formatCountdown(remaining))
      }
    }

    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-gray-600 text-xs italic">
        <Clock size={12} />
        This message has expired.
      </div>
    )
  }

  return (
    <div className="relative">
      {children}
      {expiresAt && countdown && (
        <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-bold">
          <Clock size={8} />
          {countdown}
        </div>
      )}
    </div>
  )
}
