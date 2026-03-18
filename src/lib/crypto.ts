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

// Derive an AES key from user's backup password using PBKDF2
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' } as Pbkdf2Params,
    keyMaterial,
    { name: 'AES-GCM', length: 256 } as AesKeyGenParams,
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt private key with backup password
export async function encryptPrivateKey(privateKey: Uint8Array, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveKeyFromPassword(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv } as AesGcmParams,
    aesKey,
    privateKey as any
  );
  // Combine salt + iv + encrypted into a single Uint8Array
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return encodeBase64(combined);
}

// Decrypt private key with backup password
export async function decryptPrivateKey(encryptedData: string, password: string): Promise<Uint8Array> {
  try {
    const combined = decodeBase64(encryptedData);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);
    const aesKey = await deriveKeyFromPassword(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv } as AesGcmParams, 
      aesKey, 
      data as any
    );
    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('Backup decryption failed:', error);
    throw error;
  }
}

export const initializeEncryption = async (forceReset: boolean = false) => {
  const supabase = createClient()
  if (!supabase) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (forceReset) {
    await resetKeys();
    return { status: 'ready' }
  }

  let secretKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)
  
  if (!secretKey) {
    // Check if user already has a public key in DB. 
    const { data: profile } = await supabase
      .from('users')
      .select('public_key, encrypted_private_key')
      .eq('id', user.id)
      .single()

    if (profile?.encrypted_private_key) {
      // User has encrypted keys on Supabase, trigger recovery
      return { status: 'needs_recovery' }
    }

    if (profile?.public_key) {
      // User has keys on another device but no backup set up
      // We allow a reset if the user is stuck
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

export const resetKeys = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const newKeyPair = generateKeyPair()
  saveSecretKey(newKeyPair.secretKey)
  
  await supabase
    .from('users')
    .update({ 
      public_key: newKeyPair.publicKey,
      encrypted_private_key: null,
      key_backup_method: 'none',
      key_backup_hint: null,
      key_backup_created_at: null
    })
    .eq('id', user.id)
    
  return newKeyPair.publicKey
}
