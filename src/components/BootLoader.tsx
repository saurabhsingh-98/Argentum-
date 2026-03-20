"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

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
          {/* Logo & Brand Unit */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div 
               animate={{ 
                 y: [0, -10, 0],
                 filter: ["drop-shadow(0 0 10px rgba(192, 192, 192, 0.4))", "drop-shadow(0 0 30px rgba(192, 192, 192, 0.8))", "drop-shadow(0 0 10px rgba(192, 192, 192, 0.4))"]
               }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="relative"
            >
              <div className="absolute inset-x-0 bottom-0 h-4 bg-white/20 blur-2xl rounded-full" />
              <img src="/logo.png" alt="Argentum" className="h-40 w-auto object-contain logo-blend" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col items-center"
            >
              <h1 className="brand-text text-5xl tracking-[0.4em] font-black">
                Argentum
              </h1>
              <p className="text-[10px] text-muted font-bold uppercase tracking-[0.6em] mt-2 opacity-50">
                Protocol of Builders
              </p>
            </motion.div>
          </motion.div>
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
