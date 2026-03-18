"use client"

import { useState } from 'react'
import { 
  Settings, 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Globe, 
  Bell, 
  Database,
  Save,
  RefreshCcw,
  Zap,
  UserPlus
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminSettings() {
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  return (
    <div className="space-y-10 max-w-4xl">
      <header>
         <h1 className="text-4xl font-black tracking-tighter mb-2">Global Settings</h1>
         <p className="text-gray-500 text-sm font-medium tracking-tight">Platform-wide configurations and security parameters.</p>
      </header>

      <div className="space-y-8">
        {/* Security Section */}
        <section className="space-y-6">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
             <Shield size={14} /> Security Controllers
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Maintenance Mode', desc: 'Seal the platform for development.', icon: Lock, status: 'OFF' },
                { label: 'Registration Gate', desc: 'Disable new builder signups.', icon: UserPlus, status: 'OPEN' },
                { label: 'Speak Broadcasts', desc: 'Toggle global premium broadcasts.', icon: Zap, status: 'ON' },
                { label: 'Network Visibility', desc: 'Toggle public profile discovery.', icon: Globe, status: 'ON' },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border p-6 rounded-3xl flex items-center justify-between transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                         <item.icon size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest text-foreground">{item.label}</p>
                         <p className="text-[10px] text-gray-500 font-medium">{item.desc}</p>
                      </div>
                   </div>
                   <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.status === 'ON' || item.status === 'OPEN' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                     {item.status}
                   </button>
                </div>
              ))}
           </div>
        </section>

        {/* Technical Section */}
        <section className="space-y-6">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
             <Database size={14} /> Database & Sync
           </h2>
           <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
              <div className="p-6 flex items-center justify-between">
                 <div>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Cache Invalidation</p>
                    <p className="text-[10px] text-gray-500 font-medium">Clear all CDN and Redis edge caches instantly.</p>
                 </div>
                 <button className="px-6 py-3 bg-white/5 text-silver text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                   <RefreshCcw size={14} /> Flush Edge
                 </button>
              </div>
              <div className="p-6">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Environment Keys</p>
                 <div className="bg-card p-4 rounded-2xl border border-border font-mono text-[10px] text-foreground/40">
                    SUPABASE_URL: https://*******.supabase.co<br/>
                    SITE_URL: http://localhost:3000/
                 </div>
              </div>
           </div>
        </section>
      </div>

      <div className="pt-10 flex items-center gap-4">
         <button 
           onClick={handleSave}
           disabled={saving}
           className="px-10 py-5 bg-red-600 text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-500 transition-all shadow-xl shadow-red-900/20 flex items-center gap-3 disabled:opacity-50"
         >
           {saving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
           {saving ? 'Processing...' : 'Save Configuration'}
         </button>
         <button className="px-8 py-5 bg-foreground/5 text-foreground/40 text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:text-foreground transition-all">
           Revert Changes
         </button>
      </div>
    </div>
  )
}
