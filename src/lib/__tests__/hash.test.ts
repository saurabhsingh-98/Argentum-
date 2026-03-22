// Feature: argentum-refinements, Property 2: Hash Idempotence
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { hashContent } from '../utils/hash'

describe('Hash Idempotence', () => {
  it('produces the same hash for the same input (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (s) => {
        const h1 = await hashContent(s)
        const h2 = await hashContent(s)
        return h1 === h2
      }),
      { numRuns: 100 }
    )
  })

  it('produces a 64-char hex string', async () => {
    const hash = await hashContent('hello world')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hashes for different inputs', async () => {
    const h1 = await hashContent('foo')
    const h2 = await hashContent('bar')
    expect(h1).not.toBe(h2)
  })
})
