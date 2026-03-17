import nacl from 'tweetnacl'
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from 'tweetnacl-util'
import { createClient } from './supabase/client'

const PRIVATE_KEY_STORAGE_KEY = 'argentum_private_key'

export interface KeyPair {
  publicKey: string
  secretKey: string
}

export const generateKeyPair = (): KeyPair => {
  const keyPair = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey)
  }
}

export const getStoredSecretKey = (): Uint8Array | null => {
  const stored = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)
  if (!stored) return null
  return decodeBase64(stored)
}

export const saveSecretKey = (secretKey: string) => {
  localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, secretKey)
}

export const encryptMessage = (
  message: string,
  recipientPublicKey: string,
  senderSecretKey: Uint8Array
): string => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const messageUint8 = decodeUTF8(message)
  const recipientPublicKeyUint8 = decodeBase64(recipientPublicKey)
  
  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKeyUint8,
    senderSecretKey
  )

  const fullMessage = new Uint8Array(nonce.length + encrypted.length)
  fullMessage.set(nonce)
  fullMessage.set(encrypted, nonce.length)

  return encodeBase64(fullMessage)
}

export const decryptMessage = (
  encryptedFullMessage: string,
  senderPublicKey: string,
  recipientSecretKey: Uint8Array
): string | null => {
  try {
    const fullMessageUint8 = decodeBase64(encryptedFullMessage)
    const nonce = fullMessageUint8.slice(0, nacl.box.nonceLength)
    const message = fullMessageUint8.slice(nacl.box.nonceLength)
    const senderPublicKeyUint8 = decodeBase64(senderPublicKey)

    const decrypted = nacl.box.open(
      message,
      nonce,
      senderPublicKeyUint8,
      recipientSecretKey
    )

    if (!decrypted) return null
    return encodeUTF8(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}

export const initializeEncryption = async () => {
  const supabase = createClient()
  if (!supabase) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let secretKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)
  
  if (!secretKey) {
    // Check if user already has a public key in DB. 
    // If they do, but we lack private key, we can't do much on this device.
    const { data: profile } = await supabase
      .from('users')
      .select('public_key')
      .eq('id', user.id)
      .single()

    if (profile?.public_key) {
      // User has keys on another device
      return { status: 'missing_private_key' }
    }

    // New user or keys never set up
    const newKeyPair = generateKeyPair()
    saveSecretKey(newKeyPair.secretKey)
    secretKey = newKeyPair.secretKey

    await supabase
      .from('users')
      .update({ public_key: newKeyPair.publicKey })
      .eq('id', user.id)
    
    return { status: 'initialized', publicKey: newKeyPair.publicKey }
  }

  return { status: 'ready' }
}
