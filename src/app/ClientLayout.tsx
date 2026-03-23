"use client"

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { SearchProvider } from '@/context/SearchContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'

import { AnimatePresence, motion } from 'framer-motion'

const CommandPalette = dynamic(() => import('@/components/CommandPalette'), { ssr: false })
const PresenceHandler = dynamic(() => import('@/components/PresenceHandler'), { ssr: false })
const SessionManager = dynamic(() => import('@/components/SessionManager'), { ssr: false })

function LayoutContent({ children, isMessages, isAuth, isPageMounted, pathname }: { 
  children: React.ReactNode, 
  isMessages: boolean, 
  isAuth: boolean, 
  isPageMounted: boolean,
  pathname: string
}) {
  const { theme } = useTheme()

  return (
    <>
      {/* Clean Background - Removing mesh, blob, and noise */}
      <div className={`fixed inset-0 z-[-1] transition-opacity duration-1000 ${theme === 'glass' ? 'opacity-[0.03]' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      </div>

      {!isMessages && !isAuth && <Navbar />}

      <AnimatePresence mode="wait">
        <motion.main 
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`min-h-screen ${!isMessages && !isAuth ? 'pt-4' : ''} ${isPageMounted ? 'opacity-100' : 'opacity-0'}`}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {!isMessages && !isAuth && <Footer />}
      <CommandPalette />
      <PresenceHandler />
      <SessionManager />
    </>
  )
}

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
  const isAuth = pathname?.startsWith('/auth')

  return (
    <ThemeProvider>
      <SearchProvider>
        <LayoutContent 
          isMessages={isMessages} 
          isAuth={isAuth} 
          isPageMounted={isPageMounted}
          pathname={pathname || ''}
        >
          {children}
        </LayoutContent>
      </SearchProvider>
    </ThemeProvider>
  )
}
