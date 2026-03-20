"use client"

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function SessionManager() {
  const supabase = createClient()
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          // Only fetch if user ID changed or we don't have it yet
          if (lastUserId.current === session.user.id) return
          lastUserId.current = session.user.id

          // Get user profile for metadata
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, username, display_name, avatar_url')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
            console.error('SessionManager: Profile fetch failed:', profileError)
          }

          const saved = localStorage.getItem('saved_accounts')
          let accounts = []
          try {
            accounts = saved ? JSON.parse(saved) : []
          } catch {
            accounts = []
          }

          const newAccount = {
            id: session.user.id,
            email: session.user.email,
            username: profile?.username || session.user.email?.split('@')[0],
            display_name: profile?.display_name,
            avatar_url: profile?.avatar_url,
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token
            }
          }

          // Update or add
          const index = accounts.findIndex((a: { id: string }) => a.id === newAccount.id)
          if (index > -1) {
            accounts[index] = newAccount
          } else {
            accounts.push(newAccount)
          }

          localStorage.setItem('saved_accounts', JSON.stringify(accounts))
        } else if (event === 'SIGNED_OUT') {
          lastUserId.current = null
        }
      } catch (err) {
        console.error('SessionManager error:', err)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])


  return null
}
