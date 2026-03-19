"use client"

import { usePathname } from 'next/navigation'
import BootLoader from '@/components/BootLoader'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CommandPalette from '@/components/CommandPalette'
import PresenceHandler from '@/components/PresenceHandler'
import SessionManager from '@/components/SessionManager'
import { useEffect, useState } from 'react'

import { SearchProvider } from '@/context/SearchContext'
import { ThemeProvider } from '@/context/ThemeContext'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isPageMounted, setIsPageMounted] = useState(false)

  useEffect(() => {
    setIsPageMounted(true)
    return () => setIsPageMounted(false)
  }, [pathname])

  const isMessages = pathname?.startsWith('/messages')
  const isProfile = pathname?.startsWith('/profile')
  const isAuth = pathname?.startsWith('/auth')

  return (
    <ThemeProvider>
      <SearchProvider>
        <BootLoader />
        <div className="mesh-gradient-bg" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1] mix-blend-overlay glass-noise" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="glow-blob opacity-[0.05] dark:opacity-[0.03] glass:opacity-[0.08]" />
        <div className="glow-blob opacity-[0.05] dark:opacity-[0.03] glass:opacity-[0.08]" style={{ animationDelay: '-5s', left: '60%', top: '40%' }} />
        <div className="glow-blob opacity-[0.05] dark:opacity-[0.03] glass:opacity-[0.08]" style={{ animationDelay: '-10s', left: '10%', top: '70%', width: '600px', height: '600px' }} />
        <div className="glow-blob opacity-[0.05] dark:opacity-[0.03] glass:opacity-[0.08]" style={{ animationDelay: '-15s', left: '80%', top: '20%', width: '400px', height: '400px' }} />
        {!isMessages && !isAuth && <Navbar />}
        <main className={`min-h-screen ${!isMessages && !isAuth ? 'pt-4' : ''} transition-all duration-700 ease-out ${isPageMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {children}
        </main>
        {!isMessages && !isAuth && <Footer />}
        <CommandPalette />
        <PresenceHandler />
        <SessionManager />
      </SearchProvider>
    </ThemeProvider>
  )
}
