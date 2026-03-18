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
