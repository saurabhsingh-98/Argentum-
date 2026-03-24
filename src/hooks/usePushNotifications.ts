'use client'

import { useState, useCallback } from 'react'
import { subscribeToPush, savePushSubscription } from '@/lib/webpush'

type Status = 'idle' | 'loading' | 'subscribed' | 'denied' | 'error'

export function usePushNotifications() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const subscribe = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const subscription = await subscribeToPush()

      if (!subscription) {
        // null means permission denied or unsupported
        setStatus('denied')
        return
      }

      await savePushSubscription(subscription)
      setStatus('subscribed')
    } catch (err: any) {
      console.error('Push subscription failed:', err)
      setError(err.message || 'Unknown error')
      setStatus('error')
    }
  }, [])

  return { subscribe, status, error }
}
