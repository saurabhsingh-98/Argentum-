import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription } = await req.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    // Upsert by endpoint so re-subscribing the same device doesn't create duplicates
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, subscription, endpoint: subscription.endpoint },
        { onConflict: 'endpoint' }
      )

    if (error) {
      console.error('push_subscriptions upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('webpush subscribe error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
