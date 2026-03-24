/**
 * Converts a URL-safe base64 VAPID public key to a Uint8Array
 * required by pushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

/**
 * Registers the service worker and subscribes to push notifications.
 * Returns the PushSubscription or null if not supported / permission denied.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser.')
    return null
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.')
  }

  // Request notification permission — must be triggered by user interaction
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission denied.')
    return null
  }

  // Register (or reuse) the service worker
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  // Check for an existing subscription first to avoid duplicate subscriptions
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  // Subscribe with the VAPID public key
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
  })

  return subscription
}

/**
 * Sends the PushSubscription to your backend to be stored in Supabase.
 */
export async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const res = await fetch('/api/webpush/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to save push subscription')
  }
}
