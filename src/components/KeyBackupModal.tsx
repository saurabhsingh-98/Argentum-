"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Key, 
  FileJson, 
  X, 
  ChevronRight, 
  Lock, 
  ShieldCheck, 
  AlertTriangle,
  Download,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getStoredSecretKey, encryptPrivateKey } from '@/lib/crypto'

interface KeyBackupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  isSettingsMode?: boolean
}

type Step = 'choose' | 'pin' | 'password' | 'export' | 'success'

export default function KeyBackupModal({ isOpen, onClose, onSuccess, isSettingsMode }: KeyBackupModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [isConfirming, setIsConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hint, setHint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) {
      setStep('choose')
      setPin(['', '', '', '', '', ''])
      setConfirmPin(['', '', '', '', '', ''])
      setIsConfirming(false)
      setPassword('')
      setConfirmPassword('')
      setHint('')
      setError(null)
    }
  }, [isOpen])

  const handleBack = () => {
    if (isConfirming) setIsConfirming(false)
    else setStep('choose')
    setError(null)
  }

  const handlePinChange = (val: string, index: number, isConfirm: boolean) => {
    const newPin = [...(isConfirm ? confirmPin : pin)]
    if (val.length <= 1 && /^\d*$/.test(val)) {
      newPin[index] = val
      if (isConfirm) setConfirmPin(newPin)
      else setPin(newPin)
      
      // Auto-focus next
      if (val && index < 5) {
        const nextInput = document.getElementById(`pin-${isConfirm ? 'confirm-' : ''}${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const getPasswordStrength = (p: string) => {
    if (!p) return 0
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const handleBackup = async (method: 'password' | 'exported', secret: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const privateKey = getStoredSecretKey()
      if (!privateKey) throw new Error('Private key not found on this device')

      const encrypted = await encryptPrivateKey(privateKey, secret)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          encrypted_private_key: encrypted,
          key_backup_method: method,
          key_backup_hint: hint || null,
          key_backup_created_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setStep('success')
      onSuccess?.()
    } catch (err: any) {
      console.error('Backup failed:', err)
      setError(err.message || 'Failed to create backup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadBackup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (getPasswordStrength(password) < 2) {
      setError('Password is too weak')
      return
    }

    setIsLoading(true)
    try {
      const privateKey = getStoredSecretKey()
      if (!privateKey) throw new Error('Private key not found')

      const encrypted = await encryptPrivateKey(privateKey, password)
      const { data: { user } } = await supabase.auth.getUser()
      
      const backupData = {
        version: 1,
        created_at: new Date().toISOString(),
        username: user?.email?.split('@')[0],
        encrypted_key: encrypted,
        hint: hint || null
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `argentum-key-backup-${new Date().getTime()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      await handleBackup('exported', password)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSubmit = () => {
    if (!isConfirming) {
      if (pin.some(d => !d)) return
      setIsConfirming(true)
    } else {
      if (pin.join('') !== confirmPin.join('')) {
        setError('PINs do not match')
        setConfirmPin(['', '', '', '', '', ''])
        return
      }
      handleBackup('password', pin.join(''))
    }
  }

  const handlePasswordSubmit = () => {
    if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
    }
    handleBackup('password', password)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
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
            className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                {step !== 'choose' && step !== 'success' && (
                  <button onClick={handleBack} className="p-2 hover:bg-foreground/5 rounded-full transition-all">
                    <ArrowLeft size={20} className="text-foreground/40" />
                  </button>
                )}
                <div className="flex-1 text-center">
                   <h2 className="text-xl font-black tracking-tight text-foreground italic">Argentum Shield</h2>
                </div>
                {!isSettingsMode && step !== 'success' && (
                  <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-all">
                    <X size={20} className="text-foreground/40" />
                  </button>
                )}
              </div>

              {step === 'choose' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-black mb-2 text-foreground">Back up your messages</h3>
                    <p className="text-sm text-foreground/40 max-w-xs mx-auto">
                      Your keys are only stored on this device. Create a backup to avoid losing your messages forever.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <MethodCard 
                      icon={<Shield className="text-foreground shrink-0" />} 
                      title="PIN Backup" 
                      desc="Simple recovery for daily use" 
                      badge="Recommended"
                      onClick={() => setStep('pin')}
                    />
                    <MethodCard 
                      icon={<Key className="text-foreground/40 shrink-0" />} 
                      title="Custom Password" 
                      desc="Maximum security for your vault" 
                      onClick={() => setStep('password')}
                    />
                    <MethodCard 
                      icon={<FileJson className="text-foreground/40 shrink-0" />} 
                      title="Export Backup File" 
                      desc="Download and store it yourself" 
                      onClick={() => setStep('export')}
                    />
                    {!isSettingsMode && (
                      <button 
                        onClick={onClose}
                        className="w-full p-6 mt-4 rounded-3xl border border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-all text-left"
                      >
                         <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-red-500 shrink-0" />
                            <div>
                               <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Skip for now</h4>
                               <p className="text-[10px] text-red-500/60 font-medium">You will lose access if you lose this device.</p>
                            </div>
                         </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'pin' && (
                <div className="space-y-8 py-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-foreground/5 border border-border flex items-center justify-center mx-auto mb-6 scale-animation">
                      <Lock size={32} className="text-foreground" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-foreground">{isConfirming ? 'Confirm your PIN' : 'Set a backup PIN'}</h3>
                    <p className="text-sm text-foreground/40">6 digits to restore your identity</p>
                  </div>

                  <div className="flex justify-center gap-3">
                    {[0,1,2,3,4,5].map(i => (
                      <input
                        key={i}
                        id={`pin-${isConfirming ? 'confirm-' : ''}${i}`}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={isConfirming ? confirmPin[i] : pin[i]}
                        onChange={(e) => handlePinChange(e.target.value, i, isConfirming)}
                        className="w-12 h-16 bg-background border border-border rounded-2xl text-center text-2xl font-black text-foreground focus:border-foreground/40 focus:ring-4 focus:ring-foreground/5 outline-none transition-all"
                      />
                    ))}
                  </div>

                  {!isConfirming && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Backup Hint (Optional)</label>
                       <input 
                         type="text"
                         placeholder="e.g. Grandma's birthday"
                         value={hint}
                         onChange={(e) => setHint(e.target.value)}
                         className="w-full p-5 bg-background border border-border rounded-3xl text-sm focus:border-foreground/40 transition-all"
                       />
                    </div>
                  )}

                  {error && (
                    <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest">{error}</p>
                  )}

                  <button
                    onClick={handlePinSubmit}
                    disabled={isLoading || (isConfirming ? confirmPin.some(d => !d) : pin.some(d => !d))}
                    className="w-full py-5 bg-foreground text-background rounded-3xl font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all shadow-xl"
                  >
                    {isLoading ? 'Encrypting...' : isConfirming ? 'Confirm & Protect' : 'Next Step'}
                  </button>
                </div>
              )}

              {step === 'password' && (
                <div className="space-y-8 py-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-foreground/5 border border-border flex items-center justify-center mx-auto mb-6">
                      <Key size={32} className="text-foreground" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-foreground">Custom Password</h3>
                    <p className="text-sm text-foreground/40">Use a phrase only you know</p>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Enter Password</label>
                       <input 
                         type="password"
                         placeholder="Minimum 8 characters"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full p-5 bg-background border border-border rounded-3xl text-sm focus:border-foreground/40 transition-all"
                       />
                       <div className="flex gap-1 px-4 mt-2">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${getPasswordStrength(password) >= i ? 'bg-foreground shadow-xl' : 'bg-foreground/5'}`} />
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Confirm Password</label>
                       <input 
                         type="password"
                         placeholder="Repeat password"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full p-5 bg-background border border-border rounded-3xl text-sm focus:border-foreground/40 transition-all"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Backup Hint (Optional)</label>
                       <input 
                         type="text"
                         placeholder="Wait, what was it?"
                         value={hint}
                         onChange={(e) => setHint(e.target.value)}
                         className="w-full p-5 bg-background border border-border rounded-3xl text-sm focus:border-foreground/40 transition-all"
                       />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest">{error}</p>
                  )}

                  <button
                    onClick={handlePasswordSubmit}
                    disabled={isLoading || !password || password !== confirmPassword || getPasswordStrength(password) < 2}
                    className="w-full py-5 bg-foreground text-background rounded-3xl font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all shadow-xl"
                  >
                    {isLoading ? 'Securing...' : 'Verify & Backup'}
                  </button>
                </div>
              )}

              {step === 'export' && (
                <div className="space-y-8 py-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-foreground/5 border border-border flex items-center justify-center mx-auto mb-6">
                      <FileJson size={32} className="text-foreground" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-foreground">Export Metadata</h3>
                    <p className="text-sm text-foreground/40">Download keys to your vault</p>
                  </div>

                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-6">
                    <div className="flex gap-4">
                       <AlertTriangle size={24} className="text-yellow-500 shrink-0" />
                       <div className="space-y-2">
                          <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Warning</p>
                          <p className="text-[11px] text-yellow-500/60 leading-relaxed font-medium">
                            This file contains your encrypted private key. Store it in a secure location like a password manager or offline drive.
                          </p>
                       </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Password to encrypt file</label>
                       <input 
                         type="password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full p-5 bg-background border border-border rounded-3xl text-sm focus:border-foreground/40 transition-all"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-foreground/20 ml-4">Confirm Encryption Password</label>
                       <input 
                         type="password"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full p-5 bg-background border border-border rounded-3xl text-sm focus:border-foreground/40 transition-all"
                       />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest">{error}</p>
                  )}

                  <button
                    onClick={handleDownloadBackup}
                    disabled={isLoading || !password || password !== confirmPassword}
                    className="w-full py-5 bg-foreground text-background rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl"
                  >
                    <Download size={16} />
                    {isLoading ? 'Generating File...' : 'Download & Save Backup'}
                  </button>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-12">
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="w-24 h-24 rounded-full bg-foreground/5 border border-border flex items-center justify-center mx-auto mb-8 shadow-xl"
                   >
                     <CheckCircle2 size={48} className="text-foreground" />
                   </motion.div>
                   <h3 className="text-3xl font-black mb-4 text-foreground">You're Protected</h3>
                   <p className="text-foreground/40 text-sm max-w-xs mx-auto mb-10 font-medium">
                     Your message keys are safely backed up to Argentum Shield. You can now recover your conversations on any device.
                   </p>
                   <button
                     onClick={onClose}
                     className="px-12 py-5 bg-foreground text-background rounded-[2rem] font-black uppercase tracking-widest text-xs transition-shadow shadow-xl"
                   >
                     Done
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function MethodCard({ icon, title, desc, badge, onClick }: { 
  icon: React.ReactNode, 
  title: string, 
  desc: string, 
  badge?: string,
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-6 rounded-[2rem] border border-border bg-card hover:bg-foreground/5 hover:border-foreground/20 transition-all text-left flex items-center gap-5 group"
    >
      <div className="p-4 rounded-2xl bg-background border border-border group-hover:border-foreground/20 transition-all">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">{title}</h4>
          {badge && (
             <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-foreground/10 text-foreground border border-foreground/20">
               {badge}
             </span>
          )}
        </div>
        <p className="text-[11px] text-foreground/40 font-medium">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-foreground/10 group-hover:text-foreground/40 transition-all" />
    </button>
  )
}
