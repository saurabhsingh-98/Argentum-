"use client"

import { useEffect, useState } from 'react'

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshToken = async () => {
    try {
      setLoading(true)
      console.log('[CSRF] Fetching new token...')
      const res = await fetch('/api/admin/csrf', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[CSRF] Token acquired.')
        setToken(data.token)
      } else {
        const text = await res.text().catch(() => 'No body')
        console.warn(`[CSRF] Failed to fetch token: ${res.status} ${text}`)
        setToken(null)
      }
    } catch (e) {
      console.error('[CSRF] Error during refresh:', e)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshToken()
    // Refresh token every 2 hours to avoid "today's date" boundary issues
    const interval = setInterval(refreshToken, 1000 * 60 * 60 * 2)
    return () => clearInterval(interval)
  }, [])

  return { token, loading, refreshToken }
}
