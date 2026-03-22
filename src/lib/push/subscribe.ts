/**
 * Client-side push subscription helper.
 * Registers the service worker, subscribes to push, and POSTs the
 * subscription to /api/webpush/subscribe.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser.')
    return false
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const res = await fetch('/api/webpush/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    })

    return res.ok
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}
