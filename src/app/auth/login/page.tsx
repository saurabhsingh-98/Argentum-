"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Github, Mail, Lock, LogIn, ArrowRight, UserPlus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production environmental variables.
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
      'http://localhost:3000/'
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
    return url
  }

  const handleOAuth = async (provider: 'github' | 'google') => {
    setIsLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getURL()}auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${getURL()}auth/callback`,
          }
        })

    if (error) {
      setError(error.message)
      setIsLoading(true)
    } else if (!isLogin) {
      setError("Check your email for the confirmation link!")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-silver/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-8 mb-12">
          <Link href="/" className="flex flex-col items-center gap-4 group">
            <div className="w-16 h-16 rounded-2xl border border-silver/40 flex items-center justify-center bg-[#0d0d0d] silver-glow transition-all duration-700 group-hover:rotate-[10deg] group-hover:scale-110">
              <span className="text-2xl font-bold text-silver">Ag</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-black tracking-[0.6em] text-silver uppercase">ARGENTUM</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Protocol of Builders</span>
            </div>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-10 border-silver/20 bg-[#0a0a0a]/50 backdrop-blur-2xl shadow-2xl relative group/card"
        >
          {/* Decorative Corner */}
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t border-r border-silver/40 rounded-tr-xl" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h1 className="text-xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Welcome back, Builder' : 'Join the Protocol'}
              </h1>
              <p className="text-sm text-gray-500 mb-8 font-medium">
                {isLogin ? 'Sign in to capture your ship logs.' : 'Create an account to start your build streak.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 mb-8">
            <button 
              onClick={() => handleOAuth('github')}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 w-full bg-[#111] hover:bg-[#1a1a1a] border border-white/5 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:border-white/20 active:scale-[0.98]"
            >
              <Github size={16} />
              <span>Continue with GitHub</span>
            </button>
            <button 
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 w-full bg-[#111] hover:bg-[#1a1a1a] border border-white/5 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:border-white/20 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.91 3.23-2.02 4.35-1.11 1.11-2.83 2.15-5.82 2.15-4.67 0-8.52-3.8-8.52-8.5s3.85-8.5 8.52-8.5c2.56 0 4.41.91 5.8 2.3l2.3-2.3C18.41 1.54 15.68 0 12.48 0 6.94 0 2.45 4.5 2.45 10s4.49 10 10.03 10c3.02 0 5.3-.99 7.03-2.73 1.77-1.78 2.33-4.3 2.33-6.33 0-.6-.05-1.18-.15-1.72h-9.2z"/></svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative z-10 bg-[#0a0a0a] px-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
              OR USE EMAIL
            </span>
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`
                mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]
                ${isLoading ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'silver-metallic shadow-glow hover:brightness-110'}
              `}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'signin-btn' : 'signup-btn'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                  {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                </motion.div>
              </AnimatePresence>
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] font-bold">
            <span className="text-gray-600 uppercase tracking-tight">
              {isLogin ? "Don't have an account? " : "Already registered? "}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:text-green-400 transition-colors uppercase tracking-tight"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </motion.div>
        
        <p className="mt-12 text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-relaxed">
          SECURE BLOCKCHAIN-BACKED AUTHENTICATION <br />
          © {new Date().getFullYear()} ARGENTUM PROTOCOL
        </p>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
