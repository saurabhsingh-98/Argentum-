'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    } else {
      console.error(JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      }))
    }
  }, [error])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 mb-8 relative">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Argentum" className="w-full h-auto relative z-10 opacity-50 grayscale" />
      </div>

      <h1 className="text-3xl font-black tracking-tighter mb-3">Something went wrong</h1>
      <p className="text-text-secondary text-sm max-w-sm leading-relaxed mb-8">
        {error.message || 'An unexpected error occurred. Our team has been notified.'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-full silver-metallic text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
        >
          Try Again
        </button>
        <Link
          href="/feed"
          className="px-6 py-2.5 rounded-full border border-border text-[10px] font-black uppercase tracking-widest hover:bg-card transition-all"
        >
          Back to Feed
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-[10px] font-mono text-text-muted">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}
