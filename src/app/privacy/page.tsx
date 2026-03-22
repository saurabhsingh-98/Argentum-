import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Argentum',
  description: 'How Argentum collects, uses, and protects your data.',
}

const LAST_UPDATED = 'March 22, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors mb-8 inline-block">
          ← Back to Argentum
        </Link>

        <h1 className="text-5xl font-black tracking-tighter mb-3">Privacy Policy</h1>
        <p className="text-[10px] font-mono text-text-muted mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="flex flex-col gap-10 text-sm text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">1. Data We Collect</h2>
            <p>When you create an account we collect your email address, username, display name, and optional profile information such as a bio and avatar. When you post build logs we store the post content, title, category, and a SHA-256 content hash. We also collect standard server logs including IP addresses for security and abuse prevention.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">2. How We Use Your Data</h2>
            <p>We use your data to operate the Argentum platform: authenticating you, displaying your profile, delivering notifications, and providing the build feed. We do not sell your personal data to third parties. Aggregated, anonymised analytics may be used to improve the platform.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">3. End-to-End Encryption</h2>
            <p>Direct messages on Argentum are end-to-end encrypted using NaCl (TweetNaCl). Your private key is generated on your device and never transmitted to our servers. We cannot read your messages. If you lose your private key without a backup, your message history becomes permanently inaccessible.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">4. On-Chain Data</h2>
            <p>When you verify a build log, a content hash and metadata are submitted to the Hedera Consensus Service (HCS). This data is permanently recorded on a public blockchain and cannot be deleted. Do not include personal information in post content you intend to verify on-chain.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">5. Data Storage</h2>
            <p>Your data is stored in Supabase (PostgreSQL) hosted on AWS infrastructure. Media attachments are stored in Supabase Storage. Data is retained for as long as your account is active. You may request deletion of your account and associated data at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, export, or delete your personal data. To exercise these rights, contact us at <a href="mailto:privacy@argentum.build" className="underline hover:text-primary transition-colors">privacy@argentum.build</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">7. Third-Party Services</h2>
            <p>We use the following third-party services: Supabase (database and auth), Hedera Hashgraph (blockchain verification), Resend (transactional email), and Vercel (hosting). Each service has its own privacy policy governing their data handling.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">8. Cookies</h2>
            <p>We use session cookies set by Supabase Auth to keep you logged in. We do not use tracking or advertising cookies. You can clear cookies at any time through your browser settings, which will log you out.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-text-primary mb-3">9. Contact</h2>
            <p>For privacy-related questions or requests, email <a href="mailto:privacy@argentum.build" className="underline hover:text-primary transition-colors">privacy@argentum.build</a>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
