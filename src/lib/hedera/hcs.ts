// HCS client using Hedera REST Mirror Node API
// Submits messages to Hedera Consensus Service via the Hedera REST API

export interface HCSSubmitResult {
  sequenceNumber: number
}

export interface HCSPayload {
  postId: string
  userId: string
  contentHash: string
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function submitToHCS(payload: HCSPayload): Promise<HCSSubmitResult> {
  const operatorId = process.env.HEDERA_OPERATOR_ID
  const operatorKey = process.env.HEDERA_OPERATOR_KEY
  const topicId = process.env.HEDERA_TOPIC_ID

  if (!operatorId || !operatorKey || !topicId) {
    throw new Error('Hedera environment variables not configured: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_TOPIC_ID')
  }

  const message = JSON.stringify({
    postId: payload.postId,
    userId: payload.userId,
    contentHash: payload.contentHash,
    timestamp: new Date().toISOString(),
  })

  const messageBase64 = Buffer.from(message).toString('base64')

  // Use Hedera REST API to submit HCS message
  const network = process.env.HEDERA_NETWORK || 'mainnet'
  const apiBase = network === 'testnet'
    ? 'https://testnet.mirrornode.hedera.com'
    : 'https://mainnet-public.mirrornode.hedera.com'

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleep(Math.pow(2, attempt - 1) * 1000) // 1s, 2s backoff
    }

    try {
      // Submit via Hedera REST API
      const response = await fetch(`${apiBase}/api/v1/topics/${topicId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': operatorKey,
        },
        body: JSON.stringify({
          message: messageBase64,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HCS API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      const sequenceNumber = data.sequence_number ?? data.sequenceNumber ?? 0

      return { sequenceNumber }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(`HCS submit attempt ${attempt + 1} failed:`, lastError.message)
    }
  }

  throw lastError ?? new Error('HCS submission failed after 3 attempts')
}
