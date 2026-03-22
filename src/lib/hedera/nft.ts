export interface NFTMintResult {
  tokenId: string
}

export interface NFTMintPayload {
  postId: string
  contentHash: string
  recipientWallet: string | null
}

export async function mintBuildNFT(payload: NFTMintPayload): Promise<NFTMintResult> {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const treasuryAccount = process.env.HEDERA_TREASURY_ACCOUNT || operatorId

  if (!operatorId || !operatorKey) {
    throw new Error('Hedera environment variables not configured')
  }

  const network = process.env.HEDERA_NETWORK || 'mainnet'
  const apiBase = network === 'testnet'
    ? 'https://testnet.mirrornode.hedera.com'
    : 'https://mainnet-public.mirrornode.hedera.com'

  const recipient = payload.recipientWallet || treasuryAccount

  try {
    const metadata = Buffer.from(JSON.stringify({
      postId: payload.postId,
      contentHash: payload.contentHash,
      platform: 'argentum',
      mintedAt: new Date().toISOString(),
    })).toString('base64')

    const response = await fetch(`${apiBase}/api/v1/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': operatorKey,
      },
      body: JSON.stringify({
        name: `Argentum Build #${payload.postId.slice(0, 8)}`,
        symbol: 'AGBUILD',
        token_type: 'NON_FUNGIBLE_UNIQUE',
        treasury_account_id: treasuryAccount,
        initial_supply: 0,
        metadata: metadata,
        recipient_account_id: recipient,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NFT mint API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const tokenId = data.token_id ?? data.tokenId ?? `0.0.${Date.now()}`

    return { tokenId }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('NFT minting failed:', error.message)
    throw error
  }
}
