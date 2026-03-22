// Feature: argentum-refinements, Property 1: Encryption Round Trip
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import nacl from 'tweetnacl'
import { encryptMessage, decryptMessage } from '../crypto'

describe('Encryption Round Trip', () => {
  it('decrypts to original plaintext for any string (property test)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 500 }), (plaintext) => {
        // Generate two key pairs: sender and recipient
        const senderKP = nacl.box.keyPair()
        const recipientKP = nacl.box.keyPair()

        const { encodeBase64 } = require('tweetnacl-util')
        const recipientPublicKey = encodeBase64(recipientKP.publicKey)
        const senderPublicKey = encodeBase64(senderKP.publicKey)

        const encrypted = encryptMessage(plaintext, recipientPublicKey, senderKP.secretKey)
        const decrypted = decryptMessage(encrypted, senderPublicKey, recipientKP.secretKey)

        return decrypted === plaintext
      }),
      { numRuns: 100 }
    )
  })

  it('returns null when decrypting with wrong key', () => {
    const senderKP = nacl.box.keyPair()
    const recipientKP = nacl.box.keyPair()
    const wrongKP = nacl.box.keyPair()

    const { encodeBase64 } = require('tweetnacl-util')
    const encrypted = encryptMessage('hello', encodeBase64(recipientKP.publicKey), senderKP.secretKey)
    const result = decryptMessage(encrypted, encodeBase64(senderKP.publicKey), wrongKP.secretKey)

    expect(result).toBeNull()
  })
})
