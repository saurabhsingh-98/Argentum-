"use client"

import { useEffect, useState } from "react"

export default function BootLoader() {
  const [show, setShow] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Initializing Argentum")

  useEffect(() => {
    const isBooted = sessionStorage.getItem("argentum_booted")
    if (!isBooted) {
      setShow(true)
      
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer)
            setTimeout(() => {
              setShow(false)
              sessionStorage.setItem("argentum_booted", "true")
            }, 1000)
            return 100
          }
          const next = prev + Math.random() * 8
          if (next > 20) setStatus("Syncing Protocol")
          if (next > 45) setStatus("Verifying Proofs")
          if (next > 75) setStatus("Loading Feed")
          return next
        })
      }, 100)

      return () => clearInterval(timer)
    }
  }, [])

  if (!show) return null

  const brand = "ARGENTUM"

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-16 overflow-hidden transition-all duration-1000 font-sans">
      {/* Clean Minimal Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card to-transparent" />
      </div>

      {/* Center Brand Block */}
      <div className="relative flex flex-col items-center gap-8 z-10">
        <div className="relative group">
          <div className="w-28 h-28 rounded-[2rem] border border-border flex items-center justify-center bg-card silver-glow relative overflow-hidden transition-all duration-700 group-hover:scale-110 shadow-2xl">
            <img src="/logo.png" alt="Argentum Logo" className="w-20 h-20 object-contain relative z-10" />
            
            {/* Subtle Loading Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-silver/10 to-transparent" />
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-hidden">
          {brand.split("").map((char, i) => (
            <span 
              key={i} 
              className="text-sm font-black text-muted tracking-[0.8em] animate-slide-up-char"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="glass:glass-text">{char}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Progress Block */}
      <div className="w-72 flex flex-col gap-4 items-center z-10">
        <div className="w-full h-[4px] bg-foreground/5 rounded-full overflow-hidden relative border border-border">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-silver via-white-silver to-primary-silver transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between w-full font-mono">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Protocol Sync</span>
                <span className="text-[10px] font-bold text-primary uppercase animate-pulse">
                    {status}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">Complete</span>
                <span className="text-[10px] font-bold text-primary">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up-char {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up-char {
          animation: slide-up-char 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
