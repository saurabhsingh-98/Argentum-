import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage instead of the Web Locks API to avoid
        // "AbortError: Lock broken by another request with the 'steal' option"
        // which occurs when service workers or other tabs steal the lock
        // during token refresh.
        storageKey: 'argentum-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        lock: undefined,
      }
    }
  )
}

/**
 * Resilient helper to fetch user with a timeout to prevent infinite loading.
 */
export async function getUserWithTimeout(timeoutMs = 8000) {
  const supabase = createClient()
  
  try {
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), timeoutMs)
    )

    const result = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as any

    return { user: result.data?.user || null, error: result.error || null }
  } catch (error) {
    console.warn('getUserWithTimeout: Request timed out or failed', error)
    return { user: null, error }
  }
}
