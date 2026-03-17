"use client"

import { useState } from 'react'
import { Download, Copy, Check, ShieldCheck, ShieldAlert, Palette, Type, Layout, ArrowDownToLine } from 'lucide-react'
import { motion } from 'framer-motion'

const AG_LOGO_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" rx="48" fill="#0A0A0A"/>
  <text x="50%" y="58%" dominant-baseline="central" text-anchor="middle" fill="url(#silver-gradient)" style="font-family: sans-serif; font-weight: 900; font-size: 110px; letter-spacing: -4px;">Ag</text>
  <defs>
    <linearGradient id="silver-gradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF"/>
      <stop offset="0.5" stop-color="#C0C0C0"/>
      <stop offset="1" stop-color="#808080"/>
    </linearGradient>
  </defs>
</svg>
`.trim()

const LIGHT_LOGO_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" rx="48" fill="#FFFFFF"/>
  <text x="50%" y="58%" dominant-baseline="central" text-anchor="middle" fill="#0A0A0A" style="font-family: sans-serif; font-weight: 900; font-size: 110px; letter-spacing: -4px;">Ag</text>
</svg>
`.trim()

const ICON_ONLY_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="58%" dominant-baseline="central" text-anchor="middle" fill="#C0C0C0" style="font-family: sans-serif; font-weight: 900; font-size: 140px; letter-spacing: -6px;">Ag</text>
</svg>
`.trim()

const FULL_LOCKUP_SVG = `
<svg width="600" height="200" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" x="10" y="10" rx="40" fill="#0A0A0A"/>
  <text x="100" y="110" dominant-baseline="central" text-anchor="middle" fill="#C0C0C0" style="font-family: sans-serif; font-weight: 900; font-size: 90px;">Ag</text>
  <text x="220" y="110" dominant-baseline="central" fill="white" style="font-family: sans-serif; font-weight: 900; font-size: 80px; letter-spacing: 4px;">ARGENT_UM</text>
</svg>
`.trim()

export default function BrandPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const handleDownload = (svg: string, filename: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(text)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const brandColors = [
    { name: 'Background', hex: '#0a0a0a', desc: 'Main interface backdrop' },
    { name: 'Card', hex: '#111111', desc: 'Component surface color' },
    { name: 'Silver', hex: '#C0C0C0', desc: 'Primary brand accent' },
    { name: 'Accent Green', hex: '#22c55e', desc: 'Success and verification' },
    { name: 'Glow', hex: 'rgba(34,197,94,0.2)', desc: 'Soft interactive glow' },
  ]

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-20 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 rounded-3xl bg-[#111] border border-white/10 flex items-center justify-center mb-8 shadow-glow-silver/20"
          >
            <div dangerouslySetInnerHTML={{ __html: AG_LOGO_SVG }} className="w-16 h-16" />
          </motion.div>
          <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-4xl md:text-6xl font-black tracking-tighter mb-4"
          >
            Brand Assets
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-gray-500 text-lg max-w-2xl mx-auto"
          >
            Official logos, colors, and guidelines for representing the Argentum brand in your projects and media.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="mt-8 px-6 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold flex items-center gap-3"
          >
            <ShieldAlert size={16} />
            <span>Please follow these guidelines when representing Argentum</span>
          </motion.div>
        </header>

        {/* Logos Section */}
        <section className="mb-32">
          <div className="flex items-center gap-3 mb-10">
            <Layout className="text-silver" size={24} />
            <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest text-xs opacity-50">Logo Variations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LogoCard title="Primary" svg={AG_LOGO_SVG} onDownload={() => handleDownload(AG_LOGO_SVG, 'argentum-primary')} dark />
            <LogoCard title="Light" svg={LIGHT_LOGO_SVG} onDownload={() => handleDownload(LIGHT_LOGO_SVG, 'argentum-light')} />
            <LogoCard title="Icon Only" svg={ICON_ONLY_SVG} onDownload={() => handleDownload(ICON_ONLY_SVG, 'argentum-icon')} dark />
            <LogoCard title="Full Lockup" svg={FULL_LOCKUP_SVG} onDownload={() => handleDownload(FULL_LOCKUP_SVG, 'argentum-lockup')} dark horizontal />
          </div>
        </section>

        {/* Colors Section */}
        <section className="mb-32">
          <div className="flex items-center gap-3 mb-10">
            <Palette className="text-silver" size={24} />
            <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest text-xs opacity-50">Color Palette</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {brandColors.map((color) => (
              <div key={color.hex} className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 group">
                <div 
                  className="w-full aspect-square rounded-2xl shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-white">{color.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center justify-between">
                    {color.hex}
                    <button 
                      onClick={() => copyToClipboard(color.hex)}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-all"
                    >
                      {copiedColor === color.hex ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 italic leading-tight">{color.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography & Guidelines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
          {/* Typography */}
           <section>
            <div className="flex items-center gap-3 mb-8">
              <Type className="text-silver" size={24} />
              <h2 className="text-2xl font-black uppercase tracking-widest text-xs opacity-50">Typography</h2>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Interface Font</span>
                  <h4 className="text-4xl font-black text-white">System (San Francisco / Segoe UI)</h4>
                  <p className="text-gray-500 text-sm">Argentum uses local system fonts to prioritize performance and provide a familiar feel across different operating systems.</p>
                </div>
                <div className="space-y-4 pt-8 border-t border-white/5">
                  <p className="text-6xl font-black tracking-tighter">AaBbCc 123</p>
                  <p className="text-4xl font-bold tracking-tight">Bold Contrast for Headers</p>
                  <p className="text-2xl font-medium text-gray-400">Medium Weight for Subtitles</p>
                  <p className="text-sm font-mono text-gray-600 tracking-wider">MONOSPACE FOR CODE AND STATS</p>
                </div>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="text-silver" size={24} />
              <h2 className="text-2xl font-black uppercase tracking-widest text-xs opacity-50">Usage Guidelines</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <GuidelineCard type="do" content="Use on dark backgrounds to maintain high contrast." />
              <GuidelineCard type="do" content="Give the logo plenty of breathing room (safe zone)." />
              <GuidelineCard type="do" content="Use official color hex values for consistency." />
              <GuidelineCard type="dont" content="Never distort or skew the logo's proportions." />
              <GuidelineCard type="dont" content="Avoid using the silver logo on light or busy patterns." />
              <GuidelineCard type="dont" content="Don't add shadows, glows, or extra effects manually." />
            </div>
          </section>
        </div>

        {/* Download All */}
        <div className="text-center pb-20">
          <button className="px-12 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-4 mx-auto hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-white/10">
            <ArrowDownToLine size={18} />
            Download Brand Kit (.ZIP)
          </button>
          <p className="text-gray-600 text-[10px] mt-4 uppercase tracking-[0.2em] font-bold">Version 1.2 — Released March 2026</p>
        </div>
      </div>
    </div>
  )
}

function LogoCard({ title, svg, onDownload, dark = false, horizontal = false }: any) {
  return (
    <div className={`bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 group hover:border-white/20 transition-all ${horizontal ? 'md:col-span-2 lg:col-span-2' : ''}`}>
      <div className={`w-full aspect-[4/3] rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 ${dark ? 'bg-[#050505]' : 'bg-white'}`}>
        <div dangerouslySetInnerHTML={{ __html: svg }} className={horizontal ? 'w-full px-12' : 'w-24 h-24'} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-white/40">{title}</span>
        <button 
          onClick={onDownload}
          className="p-2 hover:bg-white/5 rounded-xl text-silver transition-colors flex items-center gap-2 group/btn"
        >
          <span className="text-[10px] font-bold hidden group-hover/btn:block">SVG</span>
          <Download size={16} />
        </button>
      </div>
    </div>
  )
}

function GuidelineCard({ type, content }: { type: 'do' | 'dont', content: string }) {
  return (
    <div className={`p-5 rounded-2xl border flex items-start gap-4 ${type === 'do' ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
      <div className={`mt-0.5 ${type === 'do' ? 'text-green-500' : 'text-red-500'}`}>
        {type === 'do' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
      </div>
      <p className="text-sm text-gray-400 font-medium">{content}</p>
    </div>
  )
}
