import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Configure web-push with VAPID details
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:support@argentum.app'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_EMAIL.startsWith('mailto:') ? VAPID_EMAIL : `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export async function POST(req: Request) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured on server' }, { status: 500 })
  }

  try {
    const { userId, title, body, url } = await req.json()

    if (!userId || !title) {
      return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 })
    }

    // Fetch subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (error) {
       console.warn('Could not fetch subscriptions (ensure push_subscriptions table exists):', error.message)
       return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, message: 'No active subscriptions found for this user.' })
    }

    const payload = JSON.stringify({ title, body, url })

    let sentCount = 0
    let failedCount = 0

    const sendPromises = subs.map(async (row: any) => {
      try {
        let subInfo
        if (typeof row.subscription === 'string') {
           subInfo = JSON.parse(row.subscription)
        } else {
           subInfo = row.subscription
        }
        
        await webpush.sendNotification(subInfo, payload)
        sentCount++
      } catch (err: any) {
        failedCount++
        console.error('Error sending push to subscription:', err)
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid; we should remove it here
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ user_id: userId, subscription: row.subscription })
        }
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount })
  } catch (err: any) {
    console.error('Push API global error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
