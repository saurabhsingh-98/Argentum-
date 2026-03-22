'use client'

import { useState } from 'react'
import { ShieldCheck, ExternalLink, Copy, CheckCircle, Clock, AlertCircle, Hash } from 'lucide-react'

interface VerificationBadgeProps {
  verificationStatus: 'unverified' | 'pending' | 'verified'
  hcsSequenceNum: number | null
  nftTokenId: string | null
  contentHash: string | null
  verifiedAt: string | null
  topicId?: string
}

export default function VerificationBadge({
  verificationStatus,
  hcsSequenceNum,
  nftTokenId,
  contentHash,
  verifiedAt,
  topicId,
}: VerificationBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!contentHash) return
    await navigator.clipboard.writeText(contentHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const truncate = (str: string, len = 16) =>
    str.length > len ? str.slice(0, len) + '…' : str

  const hashscanTopicUrl =
    topicId && hcsSequenceNum != null
      ? `https://hashscan.io/mainnet/topic/${topicId}?sequenceNumber=${hcsSequenceNum}`
      : null

  const hashscanNftUrl = nftTokenId
    ? `https://hashscan.io/mainnet/token/${nftTokenId}`
    : null

  if (verificationStatus === 'verified') {
    return (
      <div className="flex flex-col gap-5">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-accent" />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent">
            Verified
          </span>
        </div>

        {/* Content Hash */}
        {contentHash && (
          <div className="flex flex-col gap-1.5 font-mono">
            <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5">
              <Hash size={10} />
              Content Hash (SHA-256)
            </span>
            <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
              <span className="text-xs text-white flex-1 truncate">
                {truncate(contentHash)}
              </span>
              <button
                onClick={handleCopy}
                title="Copy full hash"
                className="text-gray-500 hover:text-accent transition-colors flex-shrink-0"
              >
                {copied ? <CheckCircle size={14} className="text-accent" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* HCS Sequence Number */}
        {hcsSequenceNum != null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">HCS Sequence</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-mono">#{hcsSequenceNum}</span>
              {hashscanTopicUrl && (
                <a
                  href={hashscanTopicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-accent transition-colors"
                  title="View on Hashscan"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* NFT Token ID */}
        {nftTokenId && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">NFT Token</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-mono">{truncate(nftTokenId, 12)}</span>
              {hashscanNftUrl && (
                <a
                  href={hashscanNftUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-accent transition-colors"
                  title="View NFT on Hashscan"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Verified At */}
        {verifiedAt && (
          <div className="flex justify-between items-center text-xs pt-4 border-t border-white/5">
            <span className="text-gray-500">Verified At</span>
            <span className="text-gray-400 font-mono">
              {new Date(verifiedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        )}
      </div>
    )
  }

  if (verificationStatus === 'pending') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-yellow-400" />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-400">
            Verification Pending
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your build log is being anchored on the Hedera network.
        </p>
      </div>
    )
  }

  // unverified
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-gray-500" />
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-500">
          Unverified
        </span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        This build log has not been verified on-chain yet.
      </p>
    </div>
  )
}
