"use client"

import { useEffect, useState } from 'react'
import { decryptFile, getStoredSecretKey } from '@/lib/crypto'
import { Loader2, Lock } from 'lucide-react'

interface DecryptedMediaProps {
  url: string
  senderPublicKey: string | null
  type: 'image' | 'voice' | 'file'
  fileName?: string
  className?: string
  onClick?: () => void
}

/**
 * Fetches an encrypted file from storage, decrypts it client-side,
 * and renders it as an image, audio player, or download link.
 * Falls back to direct URL if decryption fails (legacy unencrypted files).
 */
export default function DecryptedMedia({ url, senderPublicKey, type, fileName, className, onClick }: DecryptedMediaProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('audio/webm')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let revoke: string | null = null

    const load = async () => {
      setLoading(true)

      // Only attempt decryption for .enc files
      if (!url.endsWith('.enc') || !senderPublicKey) {
        setObjectUrl(url)
        setLoading(false)
        return
      }

      try {
        const secretKey = getStoredSecretKey()
        if (!secretKey) throw new Error('No secret key')

        const res = await fetch(url)
        if (!res.ok) throw new Error('Fetch failed')
        const buf = await res.arrayBuffer()
        const encryptedBytes = new Uint8Array(buf)

        const decrypted = decryptFile(encryptedBytes, senderPublicKey, secretKey)
        if (!decrypted) throw new Error('Decryption failed')

        // Detect MIME type from file extension in URL for voice
        let mime = 'application/octet-stream'
        if (type === 'image') {
          mime = 'image/jpeg'
        } else if (type === 'voice') {
          // Detect from URL path: .mp4.enc → audio/mp4, .webm.enc → audio/webm
          const base = url.replace(/\.enc$/, '')
          if (base.endsWith('.mp4')) mime = 'audio/mp4'
          else if (base.endsWith('.ogg')) mime = 'audio/ogg'
          else mime = 'audio/webm'
        }

        setMimeType(mime)
        const blob = new Blob([decrypted.buffer as ArrayBuffer], { type: mime })
        const blobUrl = URL.createObjectURL(blob)
        revoke = blobUrl
        setObjectUrl(blobUrl)
      } catch {
        // Fallback: try direct URL (legacy unencrypted)
        setObjectUrl(url)
      } finally {
        setLoading(false)
      }
    }

    load()

    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [url, senderPublicKey, type])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
        <Loader2 size={14} className="animate-spin" />
        <span>Decrypting...</span>
        <Lock size={12} className="text-green-500" />
      </div>
    )
  }

  if (!objectUrl) return null

  if (type === 'image') {
    return (
      <img
        src={objectUrl}
        alt="image"
        className={className}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : undefined }}
      />
    )
  }

  if (type === 'voice') {
    return (
      <audio
        controls
        preload="metadata"
        className={className}
        onLoadedMetadata={(e) => {
          // Force duration recalculation for blob URLs (Infinity/-1 is common for webm blobs)
          const audio = e.currentTarget
          if (!isFinite(audio.duration)) {
            audio.currentTime = Number.MAX_SAFE_INTEGER
            const onSeeked = () => {
              audio.removeEventListener('seeked', onSeeked)
              audio.currentTime = 0
            }
            audio.addEventListener('seeked', onSeeked)
          }
        }}
      >
        <source src={objectUrl} type={mimeType} />
        Your browser does not support audio.
      </audio>
    )
  }

  // file download
  return (
    <a href={objectUrl} download={fileName || 'file'} className={className}>
      {fileName || 'Download file'}
    </a>
  )
}
