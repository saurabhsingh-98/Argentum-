import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversationId, disappearingMessages } = await req.json()
  if (!conversationId || !['off', '24h', '7d'].includes(disappearingMessages)) {
    return NextResponse.json({ error: 'conversationId and disappearingMessages (off|24h|7d) required' }, { status: 400 })
  }

  // Verify user is a participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2, disappearing_messages')
    .eq('id', conversationId)
    .single() as any

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update setting
  const { error: updateError } = await (supabase.from('conversations') as any)
    .update({ disappearing_messages: disappearingMessages })
    .eq('id', conversationId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Insert system message
  const label = disappearingMessages === 'off' ? 'turned off disappearing messages' : `set messages to disappear after ${disappearingMessages}`
  await (supabase.from('messages') as any).insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `[SYSTEM]: ${label}`,
    expires_at: null,
  })

  return NextResponse.json({ disappearing_messages: disappearingMessages })
}
