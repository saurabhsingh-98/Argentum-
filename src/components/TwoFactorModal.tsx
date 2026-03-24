"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Shield, X, CheckCircle2, AlertCircle, Copy, QrCode, Key } from 'lucide-react'

interface TwoFactorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function TwoFactorModal({ isOpen, onClose, onSuccess }: TwoFactorModalProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'success'>('intro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  
  const supabase = createClient() as any

  const handleEnroll = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      })

      if (error) throw error

      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setStep('qr')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (otp.some(digit => !digit)) {
      setError("Please enter the full 6-digit code")
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Step 1: Create a challenge for this factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId!
      })
      if (challengeError) throw challengeError

      // Step 2: Verify the challenge with the TOTP code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId!,
        challengeId: challengeData.id,
        code: otp.join('')
      })
      if (verifyError) throw verifyError

      setStep('success')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      // Optional: show a small "Copied" toast
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden relative z-10 shadow-2xl glass-card"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-background to-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-silver/10 border border-primary-silver/20 flex items-center justify-center shadow-premium">
              <Shield className="text-primary-silver" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Secure Factor</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Multi-Factor Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors p-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-bold leading-tight">Add an extra layer of security to your account</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Protect your builds and protocol assets by requiring a unique code from your authenticator app whenever you sign in.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-foreground/5 border border-border flex flex-col gap-4">
                   <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                      <p className="text-[11px] font-medium text-foreground/70">Secure your session logs and protocol identity.</p>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                      <p className="text-[11px] font-medium text-foreground/70">Compatible with Google Authenticator, Authy, and more.</p>
                   </div>
                </div>

                <button 
                  onClick={handleEnroll}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl glass-button-3d text-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-premium flex items-center justify-center gap-2"
                >
                  {loading ? 'Initializing...' : (
                    <>
                      <span>Secure Account Now</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 'qr' && (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Scan QR Code</h3>
                  <p className="text-[11px] text-muted uppercase font-black tracking-widest">Use your authenticator app</p>
                </div>

                <div className="p-4 bg-white rounded-3xl border-4 border-primary-silver/20 shadow-2xl relative group flex items-center justify-center">
                  {qrCode ? (
                    qrCode.startsWith('data:') ? (
                      <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                    ) : (
                      <div 
                        dangerouslySetInnerHTML={{ __html: qrCode }} 
                        className="w-48 h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-black"
                      />
                    )
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 animate-pulse rounded-2xl">
                      <QrCode className="text-gray-300" size={40} />
                    </div>
                  )}
                </div>

                <div className="w-full space-y-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black tracking-widest uppercase text-muted">Manual Setup Key</span>
                    <div className="flex items-center gap-2 p-3 bg-foreground/5 border border-border rounded-xl">
                      <Key size={14} className="text-muted shrink-0" />
                      <code className="text-[10px] font-mono flex-1 text-left truncate">{secret}</code>
                      <button onClick={copySecret} className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors">
                        <Copy size={12} className="text-muted" />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep('verify')}
                    className="w-full py-4 rounded-2xl glass-button-3d text-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-premium"
                  >
                    I've Scanned the Code
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Verification</h3>
                  <p className="text-[11px] text-muted uppercase font-black tracking-widest">Enter the 6-digit code</p>
                </div>

                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-12 h-14 bg-card border border-border rounded-xl text-center text-xl font-black text-primary transition-all focus:border-primary-silver focus:ring-1 focus:ring-primary-silver/20 outline-none"
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/20">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="w-full flex flex-col gap-3">
                  <button 
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl glass-button-3d text-foreground text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-premium"
                  >
                    {loading ? 'Verifying...' : 'Complete Security Setup'}
                  </button>
                  <button 
                    onClick={() => setStep('qr')}
                    className="text-[10px] font-black text-muted uppercase tracking-widest hover:text-foreground transition-colors"
                  >
                    Back to QR Code
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 py-8 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 relative">
                   <motion.div 
                     initial={{ scale: 0 }} 
                     animate={{ scale: 1 }} 
                     transition={{ type: "spring", stiffness: 200, damping: 10 }}
                   >
                     <CheckCircle2 size={48} />
                   </motion.div>
                   <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse rounded-full" />
                </div>
                
                <div className="space-y-2">
                   <h3 className="text-xl font-bold">2FA Enabled</h3>
                   <p className="text-sm text-muted leading-relaxed">
                     Your account is now protected by Protocol-grade security.
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
