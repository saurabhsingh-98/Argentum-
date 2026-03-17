"use client"

import { ShieldCheck, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-silver">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Privacy Standards</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500"
          >
            Last updated: March 18, 2026
          </motion.p>
        </header>

        <div className="space-y-12">
          <Section title="1. Information We Collect" content="We collect account information you provide (username, display name, bio) and GitHub OAuth data (username, email, avatar). We also store the builds you publish and basic usage data to improve the platform experience." />

          <Section title="2. How We Use Your Information" content="Your data is used to provide service functionality, authenticate your identity, and calculate build stats/streaks. We NEVER sell your data to third parties and we NEVER use your data for advertising." />

          <Section title="3. End-to-End Encryption" content="Direct messages are encrypted on your device before being transmitted. We store only the encrypted ciphertext. We cannot read your private communications, and private keys reside only on your device locally." />

          <Section title="4. On-Chain Data" content="When you verify a build, a cryptographic hash is submitted to the Hedera network. This record is public and permanent. Only the content hash is stored on-chain, never your personal information or the full content body." />

          <Section title="5. Data Storage & Security" content="Your data is stored securely on Supabase servers located in Northeast Asia (Tokyo). We use industry-standard encryption at rest and in transit. Regular backups are performed to ensure data integrity." />

          <Section title="6. Your Rights" content="You have the right to access, export, or delete your data at any time via your Account Settings. Deleting an account is permanent and removes all your profile data from our databases (excluding on-chain hashes)." />

          <Section title="7. Third Party Services" content="We use Supabase for authentication and database management, GitHub for OAuth login, Hedera Hashgraph for build verification, and Vercel for hosting. These services have their own respective privacy policies." />

          <Section title="8. Cookies" content="Argentum uses only essential cookies for authentication and session management. We do not use tracking, advertising, or third-party analytics cookies." />

          <Section title="9. Contact Information" content="For any privacy concerns or data requests, please contact us at privacy@argentum.io or use the in-app reporting system." />
        </div>

        <footer className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Lock size={16} />
            <span className="text-sm">Argentum is committed to builder privacy by design.</span>
          </div>
          <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest text-center">
             © 2026 Argentum Technologies. Privacy Protected.
          </p>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, content }: { title: string, content: string }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#111] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all"
    >
      <h2 className="text-xl font-black text-white mb-4 tracking-tight">{title}</h2>
      <p className="text-gray-400 leading-relaxed text-sm">{content}</p>
    </motion.section>
  )
}
