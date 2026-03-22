import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitToHCS } from '@/lib/hedera/hcs'
import { mintBuildNFT } from '@/lib/hedera/nft'
import type { Database } from '@/types/database'

type PostRow = Database['public']['Tables']['posts']['Row']
type UserRow = Database['public']['Tables']['users']['Row']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await req.json()
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id, content_hash, verification_status')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single() as unknown as {
        data: Pick<PostRow, 'id' | 'user_id' | 'content_hash' | 'verification_status'> | null
        error: unknown
      }

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Don't re-verify already verified posts
    if (post.verification_status === 'verified') {
      return NextResponse.json({ status: 'already_verified' })
    }

    const contentHash = post.content_hash || ''

    // Set to pending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('posts') as any)
      .update({ verification_status: 'pending' })
      .eq('id', postId)

    let hcsSequenceNum: number | null = null
    let nftTokenId: string | null = null
    let finalStatus: 'verified' | 'unverified' = 'unverified'

    // Submit to HCS
    try {
      const hcsResult = await submitToHCS({
        postId,
        userId: user.id,
        contentHash,
      })
      hcsSequenceNum = hcsResult.sequenceNumber
      finalStatus = 'verified'
    } catch (hcsError) {
      console.error('HCS submission failed:', hcsError)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('posts') as any)
        .update({ verification_status: 'unverified' })
        .eq('id', postId)
      return NextResponse.json({
        status: 'unverified',
        error: hcsError instanceof Error ? hcsError.message : 'HCS submission failed',
      })
    }

    // Update post with HCS result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('posts') as any)
      .update({
        hcs_sequence_num: hcsSequenceNum,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', postId)

    // Fetch user wallet for NFT
    const { data: profile } = await supabase
      .from('users')
      .select('hbar_wallet')
      .eq('id', user.id)
      .single() as unknown as {
        data: Pick<UserRow, 'hbar_wallet'> | null
        error: unknown
      }

    // Mint NFT (non-blocking — failure doesn't revert verification)
    try {
      const nftResult = await mintBuildNFT({
        postId,
        contentHash,
        recipientWallet: profile?.hbar_wallet ?? null,
      })
      nftTokenId = nftResult.tokenId

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('posts') as any)
        .update({ nft_token_id: nftTokenId })
        .eq('id', postId)
    } catch (nftError) {
      console.error('NFT minting failed (non-fatal):', nftError)
    }

    return NextResponse.json({
      status: finalStatus,
      hcs_sequence_num: hcsSequenceNum,
      nft_token_id: nftTokenId,
    })
  } catch (err) {
    console.error('Blockchain submit error:', err)
    return NextResponse.json({ status: 'unverified', error: 'Internal error' })
  }
}
