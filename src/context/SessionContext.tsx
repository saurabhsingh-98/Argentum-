"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SessionContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  isLoading: true,
})

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  initialSession: Session | null
}) {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // If no initial session, try to get it on the client
    if (!initialSession) {
      const getSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
      }
      getSession()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      
      // Refresh the page if session state changes to ensure server components stay in sync
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialSession, supabase, router])

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
