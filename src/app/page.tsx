import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import FeedWithFilter from '@/components/FeedWithFilter'
import { CheckCircle2, Users, Zap, Activity, ArrowRight, Github, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import * as motion from 'framer-motion/client'
import BrandIntro from '@/components/BrandIntro'
import Hero from '@/components/Hero'

export default async function Home() {
  const supabase = await createClient()

  if (!supabase) return null

  // Parallel fetching of stats and featured content
  const [
    { count: postCount },
    { count: userCount },
    { count: verifiedCount },
    { data: recentPosts }
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('posts').select('*, users!posts_user_id_fkey(id, username, display_name, avatar_url, bio, currently_building, skills, created_at)').eq('status', 'published').order('created_at', { ascending: false }).limit(6)
  ])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-20 relative transition-colors duration-500">
      <BrandIntro />
      
      <Hero />

      {/* Stats Row */}
      <section className="py-20 border-y border-border bg-foreground/[0.01]">
         <div className="container mx-auto px-4 lg:px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
            >
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                 <StatItem label="Verified Logs" value={verifiedCount || 0} sub="On-chain Proof" />
               </motion.div>
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                 <StatItem label="Total Builders" value={userCount || 0} sub="Verified Citizens" />
               </motion.div>
               <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
                 <StatItem label="Live Builds" value={postCount || 0} sub="Shipping Daily" />
               </motion.div>
            </motion.div>
         </div>
      </section>

      {/* Featured Feed */}
      <section className="py-32 bg-background/50">
         <div className="container mx-auto px-4 lg:px-6">
            <motion.header 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="flex flex-col mb-16 items-center text-center"
            >
               <h2 className="text-xs font-black uppercase tracking-[0.5em] text-foreground/20 mb-4">The Feed</h2>
               <h3 className="text-5xl font-black tracking-tighter text-foreground">Recent <span className="silver-glow-text">Build Drops</span></h3>
            </motion.header>

            <FeedWithFilter initialPosts={recentPosts || []} />
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative px-4">
         <div className="container mx-auto text-center">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="max-w-4xl mx-auto p-16 lg:p-24 rounded-[3.5rem] bg-gradient-to-b from-foreground/[0.03] to-transparent border border-border/50 relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-silver/5 opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
               
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 relative z-10 text-foreground">Secure your build <br /> <span className="silver-glow-text">legacy forever.</span></h2>
               <p className="text-foreground/40 text-lg mb-16 max-w-lg mx-auto relative z-10 font-medium tracking-tight">
                  Join the elite builders shipping the future. 
                  Verified, eternal, and sovereign in Argentum.
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
                  <Link href="/auth/login" className="px-12 py-5 silver-metallic rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-premium">
                     Get Your Invite
                  </Link>
                  <Link href="https://github.com/saurabhsingh-94" className="flex items-center gap-3 px-12 py-5 hero-sub-button rounded-2xl font-black uppercase tracking-widest text-[11px]">
                     <Github size={18} /> Import from GitHub
                  </Link>
               </div>
            </motion.div>
         </div>
      </section>
    </div>
  )
}

function StatItem({ label, value, sub }: { label: string, value: number, sub: string }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="flex flex-col mb-2">
        <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground group-hover:scale-105 transition-transform duration-500">{value.toLocaleString()}</span>
      </div>
      <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground mb-1">{label}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">{sub}</span>
    </div>
  )
}
