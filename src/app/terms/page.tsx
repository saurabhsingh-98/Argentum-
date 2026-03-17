"use client"

import { ScrollText, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TermsPage() {
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
              <ScrollText size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Legal Documentation</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-4"
          >
            Terms & Conditions
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

        <div className="space-y-12 text-gray-300">
          <Section title="1. Acceptance of Terms" content="By using Argentum, you agree to these terms. You must be at least 13 years old to use the platform. We reserve the right to update these terms at any time with notice via in-app notification." />
          
          <Section title="2. User Accounts" content="You are responsible for maintaining the security of your account and any cryptographic keys generated. You agree to provide accurate information. Argentum reserves the right to terminate accounts that violate our community guidelines or security protocols." />

          <Section title="3. Content Policy" content="You retain ownership of the code and builds you post on Argentum. However, you grant Argentum a worldwide, non-exclusive license to display and distribute your content on the platform. Prohibited content includes spam, harassment, illegal material, malware, and impersonation." />

          <Section title="4. Intellectual Property" content="Your work is your own property. Argentum's on-chain verification provides a permanent timestamp of creation on the Hedera network, serving as public proof of existence. You agree not to copy other builders' work without explicit permission or attribution." />

          <Section title="5. Blockchain Verification" content="On-chain verification is a permanent and irreversible action recorded on a public ledger. Argentum is not responsible for network fluctuations, record permanence on the Hedera network, or any legal implications of public record-keeping." />

          <Section title="6. Messaging & Encryption" content="All direct messages are end-to-end encrypted. Argentum technically cannot read your conversations. You are responsible for the content of your messages. We cannot recover lost encryption keys if you lose access to your device." />

          <Section title="7. Disclaimer of Warranties" content="The platform is provided 'as is' without warranties of any kind. We do not guarantee continuous uptime or that the service will be free of bugs. Use Argentum at your own risk." />

          <Section title="8. Limitation of Liability" content="Argentum's liability is limited to the maximum extent permitted by law. We are not liable for any lost data, lost profits, or consequences arising from platform usage or data verification." />

          <Section title="9. Governing Law" content="These terms are governed by the laws of India. Any disputes arising from these terms shall be resolved through binding arbitration in Mumbai." />
        </div>

        <footer className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Mail size={16} />
            <span className="text-sm">Questions? Reach out to us at legal@argentum.io</span>
          </div>
          <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest text-center">
            © 2026 Argentum Technologies. All rights reserved.
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
