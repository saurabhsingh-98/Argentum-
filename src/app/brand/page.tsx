import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Brand Guidelines | Argentum',
  description: 'Official Argentum brand assets, color palette, and usage guidelines.',
}

const COLORS = [
  { name: 'Silver Primary', hex: '#C0C0C0', bg: 'bg-[#C0C0C0]', text: 'text-black' },
  { name: 'Background', hex: '#050505', bg: 'bg-[#050505] border border-white/10', text: 'text-white' },
  { name: 'Surface', hex: '#0D0D0D', bg: 'bg-[#0D0D0D] border border-white/10', text: 'text-white' },
  { name: 'Card', hex: '#111111', bg: 'bg-[#111111] border border-white/10', text: 'text-white' },
  { name: 'Border', hex: '#1F1F1F', bg: 'bg-[#1F1F1F]', text: 'text-white' },
  { name: 'Green Accent', hex: '#22C55E', bg: 'bg-[#22C55E]', text: 'text-black' },
  { name: 'Amber Accent', hex: '#F59E0B', bg: 'bg-[#F59E0B]', text: 'text-black' },
]

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors mb-8 inline-block">
            ← Back to Argentum
          </Link>
          <h1 className="text-5xl font-black tracking-tighter mb-4">Brand Guidelines</h1>
          <p className="text-text-secondary text-sm max-w-lg leading-relaxed">
            Official assets and guidelines for representing Argentum. Please follow these rules to maintain brand consistency.
          </p>
        </div>

        {/* Logo */}
        <section className="mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted mb-6">Logo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-10 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Argentum logo on dark" className="h-16 w-auto" />
            </div>
            <div className="bg-white rounded-2xl p-10 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Argentum logo on light" className="h-16 w-auto" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href="/logo.png"
              download
              className="px-4 py-2 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-card transition-all"
            >
              Download PNG
            </a>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {COLORS.map((c) => (
              <div key={c.hex} className="flex flex-col gap-2">
                <div className={`h-20 rounded-xl ${c.bg} flex items-end p-3`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${c.text}`}>{c.name}</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted">{c.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted mb-6">Typography</h2>
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Primary — Geist Sans</p>
              <p className="text-4xl font-black tracking-tighter">Build in public.</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Mono — Geist Mono</p>
              <p className="font-mono text-lg text-text-secondary">0x4172 · content_hash · @builder</p>
            </div>
          </div>
        </section>

        {/* Usage Rules */}
        <section className="mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted mb-6">Usage Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-4">Do</p>
              <ul className="flex flex-col gap-2 text-sm text-text-secondary">
                <li>✓ Use the logo on dark backgrounds</li>
                <li>✓ Maintain clear space around the logo</li>
                <li>✓ Use official hex values for brand colors</li>
                <li>✓ Reference Argentum with a capital A</li>
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">Don&apos;t</p>
              <ul className="flex flex-col gap-2 text-sm text-text-secondary">
                <li>✗ Stretch or distort the logo</li>
                <li>✗ Change logo colors</li>
                <li>✗ Place the logo on busy backgrounds</li>
                <li>✗ Use unofficial variations of the name</li>
              </ul>
            </div>
          </div>
        </section>

        <p className="text-[10px] text-text-muted font-mono">
          Questions? Contact <a href="mailto:brand@argentum.build" className="underline hover:text-primary transition-colors">brand@argentum.build</a>
        </p>
      </div>
    </div>
  )
}
