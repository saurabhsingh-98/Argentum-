import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Argentum',
  description: 'Terms and conditions for using the Argentum platform.',
}

const LAST_UPDATED = 'March 22, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors mb-8 inline-block">
          ← Back to Argentum
        </Link>

        <h1 className="text-5xl font-black tracking-tighter mb-3">Terms of Service</h1>
        <p className="text-[10px] font-mono text-text-muted mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="flex flex-col gap-10 text-sm text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Argentum you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. We may update these terms at any time; continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">2. User Accounts</h2>
            <p>You must be at least 13 years old to create an account. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorised access.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">3. Content Policy</h2>
            <p>You retain ownership of content you post. By posting, you grant Argentum a non-exclusive, worldwide licence to display and distribute your content on the platform. You must not post content that is illegal, harassing, defamatory, or infringes third-party intellectual property rights. We reserve the right to remove content that violates this policy.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">4. Intellectual Property</h2>
            <p>The Argentum name, logo, and platform code are the intellectual property of Argentum and its contributors. You may not reproduce or distribute them without written permission. Open-source components are governed by their respective licences.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">5. Blockchain Verification</h2>
            <p>When you submit a build log for on-chain verification, a content hash is permanently recorded on the Hedera Consensus Service. This record is immutable and public. You are solely responsible for ensuring the content you verify does not contain sensitive or personal information.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">6. Messaging</h2>
            <p>Direct messages are end-to-end encrypted. Argentum cannot access message content. You are responsible for maintaining your encryption keys. Loss of keys without a backup results in permanent loss of message history, for which Argentum bears no liability.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">7. Disclaimers</h2>
            <p>Argentum is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee uninterrupted availability, accuracy of content, or fitness for a particular purpose.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Argentum shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including loss of data or profits.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of the jurisdiction in which Argentum is incorporated, without regard to conflict of law principles. Any disputes shall be resolved in the courts of that jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">10. Contact</h2>
            <p>For questions about these terms, contact <a href="mailto:legal@argentum.build" className="underline hover:text-primary transition-colors">legal@argentum.build</a>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
