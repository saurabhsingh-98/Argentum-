import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, message } = await req.json()
  if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })

  // Verify post is collab and user is not the author
  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, is_collab')
    .eq('id', postId)
    .single() as any

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (!post.is_collab) return NextResponse.json({ error: 'Post is not open for collaboration' }, { status: 400 })
  if (post.user_id === user.id) return NextResponse.json({ error: 'Cannot apply to your own post' }, { status: 400 })

  // Check for duplicate
  const { data: existing } = await supabase
    .from('collab_requests')
    .select('id')
    .eq('post_id', postId)
    .eq('applicant_id', user.id)
    .single() as any

  if (existing) return NextResponse.json({ error: 'Application already submitted' }, { status: 409 })

  // Insert collab request
  const { data: request, error: insertError } = await (supabase.from('collab_requests') as any)
    .insert({ post_id: postId, applicant_id: user.id, message: message || null })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Notify post author
  await (supabase.from('notifications') as any).insert({
    user_id: post.user_id,
    from_user_id: user.id,
    type: 'collab_request',
    content: 'wants to collaborate on your post',
    link: `/post/${postId}`,
  })

  return NextResponse.json({ request }, { status: 201 })
}
