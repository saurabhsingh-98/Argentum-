"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PresenceHandler() {
  const supabase = createClient() as any

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const updateStatus = async (isOnline: boolean) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('users')
        .update({ 
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true)
      } else {
        // Delay setting offline to handle quick refreshes
        timeoutId = setTimeout(() => updateStatus(false), 5000)
      }
    }

    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable exit updates if needed, 
      // but Supabase client might not support it directly for complex updates.
      // For now, we'll try a regular update but it might be cancelled.
      updateStatus(false)
    }

    // Initial online status
    updateStatus(true)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [supabase])

  return null
}
