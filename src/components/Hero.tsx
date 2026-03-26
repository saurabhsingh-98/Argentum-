"use client"

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export default function Hero() {
  const { scrollY } = useScroll()
  
  // High-inertia scroll value for smooth "landing"
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Animation range (0 to 1000px matches the intro cleanup)
  const range = [0, 1000]
  
  // Hero Elements Transforms (Reverse Fly-past)
  const opacity = useTransform(smoothScrollY, [400, 1000], [0, 1])
  const scale = useTransform(smoothScrollY, [400, 1000], [1.3, 1])
  const y = useTransform(smoothScrollY, [400, 1000], [100, 0])
  const blur = useTransform(smoothScrollY, [400, 800], ["blur(12px)", "blur(0px)"])
  
  // Precise Typography Transform
  const h1LetterSpacing = useTransform(smoothScrollY, [400, 1000], ["1.5em", "-0.05em"])

  return (
    <section className="relative pt-32 pb-40 px-4 lg:px-6 min-h-screen">
      <div className="container mx-auto text-center relative z-10">
        
        {/* Badge */}
        <motion.div 
          style={{ opacity, scale, y }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-10 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Proof of Work Social Protocol
        </motion.div>
        
        {/* H1: Main Title */}
        <motion.h1 
          className="text-6xl md:text-8xl lg:text-[130px] font-black tracking-tighter leading-[0.85] mb-10 text-foreground transform-gpu select-none"
          style={{ 
            opacity, 
            scale, 
            y, 
            letterSpacing: h1LetterSpacing,
            filter: blur
          }}
        >
          Build in Public. <br />
          <span className="silver-glow-text dark:text-silver glass:glass-text">Prove it forever.</span>
        </motion.h1>
        
        {/* Paragraph */}
        <motion.p 
          style={{ opacity, y, scale: useTransform(smoothScrollY, [400, 1000], [0.95, 1]) }}
          className="max-w-2xl mx-auto text-foreground/50 text-lg md:text-xl leading-relaxed mb-16 font-medium tracking-tight"
        >
          The premium social network for ambitious builders. 
          Log your progress, verify your shipping history on-chain, 
          and build a legacy that lasts in Argentum.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          style={{ opacity, y }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
           <Link href="/new" className="px-12 py-5 silver-metallic rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-premium active:scale-95">
              Start Building Now
           </Link>
           <Link href="/explore" className="px-12 py-5 hero-sub-button rounded-2xl font-black uppercase tracking-widest text-[11px]">
              Explore Network
           </Link>
        </motion.div>

        {/* Scroll Down Indicator */}
        <motion.div
          style={{ opacity: useTransform(smoothScrollY, [1000, 1200], [0, 1]) }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20">Scroll to Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="text-foreground/20"
          >
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
