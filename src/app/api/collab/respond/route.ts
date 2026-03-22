import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, action } = await req.json()
  if (!requestId || !['accepted', 'declined'].includes(action)) {
    return NextResponse.json({ error: 'requestId and action (accepted|declined) are required' }, { status: 400 })
  }

  // Fetch the request and verify the current user is the post author
  const { data: collabRequest } = await supabase
    .from('collab_requests')
    .select('id, post_id, applicant_id, posts(user_id)')
    .eq('id', requestId)
    .single() as any

  if (!collabRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (collabRequest.posts?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update status
  const { error: updateError } = await (supabase.from('collab_requests') as any)
    .update({ status: action })
    .eq('id', requestId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Notify applicant
  await (supabase.from('notifications') as any).insert({
    user_id: collabRequest.applicant_id,
    from_user_id: user.id,
    type: 'collab_request',
    content: action === 'accepted' ? 'accepted your collaboration request' : 'declined your collaboration request',
    link: `/post/${collabRequest.post_id}`,
  })

  return NextResponse.json({ status: action })
}
