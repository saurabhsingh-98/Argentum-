"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export default function BrandIntro() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (!sectionRef.current || !logoRef.current || !textRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "+=120%",
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
      },
    })

    // Initial states
    gsap.set(logoRef.current, { x: -200, opacity: 0, filter: "blur(10px)" })
    gsap.set(textRef.current, { x: 200, opacity: 0, filter: "blur(10px)" })
    
    tl.to([logoRef.current, textRef.current], {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 2,
      stagger: 0.1,
      ease: "power3.out",
    })
    .to(containerRef.current, {
        scale: 1.05,
        duration: 2,
    }, "-=1")
    .to(sectionRef.current, {
      opacity: 0,
      scale: 1.1,
      filter: "blur(20px)",
      duration: 1,
    })

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full h-screen flex flex-col items-center justify-center bg-black overflow-hidden z-[200]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(192,192,192,0.08),transparent_70%)]" />
      
      <div ref={containerRef} className="relative flex items-center gap-8 md:gap-12">
        {/* Logo Slide-In */}
        <div ref={logoRef} className="relative">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
            <img 
              src="/logo.png" 
              alt="Argentum" 
              className="h-32 md:h-48 w-auto object-contain logo-blend relative z-10" 
            />
        </div>

        {/* Brand Text Slide-In */}
        <div ref={textRef} className="flex flex-col">
            <h1 className="text-7xl md:text-[120px] font-black tracking-[-0.05em] text-white silver-glow-text leading-[0.8] mb-2">
                ARGENTUM
            </h1>
            <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.5em] text-white/30 ml-2">
                The Protocol of Builders
            </p>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">Scroll to Enter</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  )
}
