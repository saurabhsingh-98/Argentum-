import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
import FeedWithFilter from '@/components/FeedWithFilter'
import { CheckCircle2, Users, Zap, Activity, ArrowRight, Github } from 'lucide-react'
import Link from 'next/link'

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
    supabase.from('posts').select('*, users(id, username, display_name, avatar_url, bio, currently_building, skills)').eq('status', 'published').order('created_at', { ascending: false }).limit(6)
  ])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pb-20 relative transition-colors duration-500">
      {/* Background Grid - Only visible in Light mode via CSS */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-[0.4] dark:opacity-[0.1] glass:hidden" />
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-4 lg:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full animate-pulse-slow" />
           <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-accent-blue/5 blur-[120px] rounded-full animate-pulse-slow delay-700" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-border text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-10 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Proof of Work Social Protocol
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[130px] font-black tracking-tighter leading-[0.85] mb-10 text-foreground">
            Build in Public. <br />
            <span className="silver-glow-text dark:text-silver glass:glass-text">Prove it forever.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-foreground/50 text-lg md:text-xl leading-relaxed mb-16 font-medium tracking-tight">
            The premium social network for ambitious builders. 
            Log your progress, verify your shipping history on-chain, 
            and build a legacy that lasts in Argentum.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
             <Link href="/new" className="px-12 py-5 silver-metallic rounded-2xl font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all shadow-premium active:scale-95">
                Start Building Now
             </Link>
             <Link href="/explore" className="px-12 py-5 bg-foreground/5 border border-border rounded-2xl font-black uppercase tracking-widest text-[11px] text-foreground/60 hover:bg-foreground/10 transition-all backdrop-blur-xl">
                Explore Network
             </Link>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="py-20 border-y border-border bg-foreground/[0.01]">
         <div className="container mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               <StatItem label="Verified Logs" value={verifiedCount || 0} sub="On-chain Proof" />
               <StatItem label="Total Builders" value={userCount || 0} sub="Verified Citizens" />
               <StatItem label="Live Builds" value={postCount || 0} sub="Shipping Daily" />
            </div>
         </div>
      </section>

      {/* Featured Feed */}
      <section className="py-32 bg-background/50">
         <div className="container mx-auto px-4 lg:px-6">
            <header className="flex flex-col mb-16 items-center text-center">
               <h2 className="text-xs font-black uppercase tracking-[0.5em] text-foreground/20 mb-4">The Feed</h2>
               <h3 className="text-5xl font-black tracking-tighter text-foreground">Recent <span className="silver-glow-text">Build Drops</span></h3>
            </header>

            <FeedWithFilter initialPosts={recentPosts || []} />
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative px-4">
         <div className="container mx-auto text-center">
            <div className="max-w-4xl mx-auto p-16 lg:p-24 rounded-[3.5rem] bg-gradient-to-b from-foreground/[0.03] to-transparent border border-border relative overflow-hidden group">
               <div className="absolute inset-0 bg-silver/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[100px]" />
               
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 relative z-10 text-foreground">Secure your build <br /> <span className="silver-glow-text">legacy forever.</span></h2>
               <p className="text-foreground/40 text-lg mb-16 max-w-lg mx-auto relative z-10 font-medium">
                  Join the elite builders shipping the future. 
                  Verified, eternal, and sovereign in Argentum.
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
                  <Link href="/auth/login" className="px-12 py-5 silver-metallic rounded-2xl font-black uppercase tracking-widest text-[11px] hover:brightness-110 transition-all shadow-premium">
                     Get Your Invite
                  </Link>
                  <Link href="https://github.com" className="flex items-center gap-3 px-12 py-5 bg-foreground/5 border border-border rounded-2xl font-black uppercase tracking-widest text-[11px] text-foreground/40 hover:bg-foreground/10 transition-all">
                     <Github size={18} /> Import from GitHub
                  </Link>
               </div>
            </div>
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
