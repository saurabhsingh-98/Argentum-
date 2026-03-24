import { createClient } from '../supabase/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export const NotificationService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  },

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!VAPID_PUBLIC_KEY) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.')
      return null
    }

    // Register SW if not already registered, then wait for it to be active
    await navigator.serviceWorker.register('/sw.js')
    const registration = await navigator.serviceWorker.ready

    // Return existing subscription if already subscribed
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await this._saveToDb(existing)
      return existing
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    })

    await this._saveToDb(subscription)
    return subscription
  },

  async _saveToDb(subscription: PushSubscription): Promise<void> {
    const res = await fetch('/api/webpush/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Failed to save push subscription:', err)
    }
  },

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()

      // Remove from DB by endpoint
      const supabase = createClient() as any
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
      }
    }
  },
}
