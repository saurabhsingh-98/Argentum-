import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.error("Supabase environment variables are missing! Falling back to mock client.")
    }
    const mock: any = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: [], error: null, count: 0 })
        }
        if (prop === 'auth') return {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signOut: () => Promise.resolve({ error: null }),
          setSession: () => Promise.resolve({ data: { session: null }, error: null }),
        }
        return () => mock
      }
    })
    return mock
  }

  return createBrowserClient<Database>(url!, key!)
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

    const { data: { user }, error } = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as any

    return { user, error: error || null }
  } catch (error) {
    console.warn('getUserWithTimeout: Request timed out or failed', error)
    return { user: null, error }
  }
}

