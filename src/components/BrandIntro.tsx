"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export default function BrandIntro() {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (!containerRef.current || !logoRef.current || !textRef.current || !scrollIndicatorRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top", 
        scrub: 1.2,
        pin: true, // Pin the content while scrolling the 120vh
      }
    })

    // Cinematic Intro Sequence
    tl.to(scrollIndicatorRef.current, { opacity: 0, duration: 0.2 }, 0)
    
    tl.to(logoRef.current, {
        scale: 2,
        y: -150,
        opacity: 0,
        filter: "blur(12px)",
        duration: 1,
        ease: "power2.inOut",
        force3D: true
    }, 0)

    tl.to(textRef.current, {
        scale: 0.7,
        y: 150,
        letterSpacing: "4em",
        opacity: 0,
        filter: "blur(12px)",
        duration: 1,
        ease: "power2.inOut",
        force3D: true
    }, 0)

    tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "none"
    }, 0.8) // Fade out at the very end

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[120vh] bg-black z-[100] perspective-[1200px] overflow-hidden"
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center pointer-events-none w-full">
        
        {/* Backdrop Spectral Glow */}
        <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full scale-110 opacity-30 pointer-events-none" />

        {/* Logo Layer */}
        <div ref={logoRef} className="relative mb-16 md:mb-24 will-change-transform transform-gpu">
            <div className="absolute inset-0 bg-white/5 blur-[60px] rounded-full scale-125 pointer-events-none" />
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-32 md:h-48 w-auto object-contain relative z-10 filter"
              style={{ filter: "drop-shadow(0 0 30px rgba(255,255,255,0.2))" }}
            />
        </div>

        {/* Typographic Layer */}
        <div ref={textRef} className="flex flex-col items-center text-center w-full px-4 transform-gpu will-change-[transform,letter-spacing]">
            <h1 className="text-6xl md:text-[150px] font-black italic tracking-tighter text-white silver-glow-text leading-[0.8] mb-10 select-none">
              ARGENTUM
            </h1>
            <p className="text-[10px] md:text-xs font-black uppercase text-white/20 ml-4 italic tracking-[0.8em]">
              The Protocol of Builders
            </p>
        </div>

        {/* Scroll Indicator */}
        <div 
          ref={scrollIndicatorRef}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 animate-pulse text-center">Scroll to Enter</span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-white/20 via-white/40 to-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-white animate-scroll-line" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scroll-line {
          animation: scroll-line 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>
    </div>
  )
}
