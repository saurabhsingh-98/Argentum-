import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a robust mock using a Proxy during build
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

  return createBrowserClient(url, key)
}
