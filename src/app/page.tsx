import { createClient } from '@/lib/supabase/server'
import FeedWrapper from '@/components/FeedWrapper'
import { CheckCircle2, Users, Zap, Activity, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'

export default async function Home() {
  const supabase = await createClient()

  if (!supabase) {
    return (
      <div className="flex flex-col gap-24 py-12 md:py-24 items-center">
        <h1 className="text-2xl font-bold">Launch configuration incomplete.</h1>
        <p className="text-gray-500">Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.</p>
      </div>
    )
  }

  // Parallel fetching of stats
  const [
    { count: postCount },
    { count: userCount },
    { count: verifiedCount },
    { data: recentPosts }
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('posts').select('*, users(*)').eq('status', 'published').order('created_at', { ascending: false }).limit(20)
  ])

  return (
    <div className="flex flex-col gap-24 py-12 md:py-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 text-center flex flex-col items-center gap-8 relative">
        <ScrollReveal direction="down">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest mb-4">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white silver-glow"></span>
                </span>
                Now in Private Beta
            </div>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white max-w-4xl leading-[1.05]">
                Build in public. <br />
                <span className="silver-glow-text italic">Prove it forever.</span>
            </h1>
        </ScrollReveal>

        <ScrollReveal delay={400}>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              The social platform for developers to share their daily builds. 
              Secure your shipping logs and build your brand with proof-of-work.
            </p>
        </ScrollReveal>

        <ScrollReveal delay={600}>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/new" className="silver-metallic px-8 py-4 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center gap-2 group shadow-glow">
                    Start building free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/explore" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all">
                    Explore builds
                </Link>
            </div>
        </ScrollReveal>
      </section>

      {/* Stats Row */}
      <section className="container mx-auto px-4">
        <ScrollReveal direction="up" delay={800}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard icon={<Zap size={20} />} label="Total Builds" value={postCount || 0} />
                <StatsCard icon={<Users size={20} />} label="Builders" value={userCount || 0} />
                <StatsCard icon={<CheckCircle2 size={20} />} label="Verified" value={verifiedCount || 0} />
                <StatsCard icon={<Activity size={20} />} label="Active Now" value={1} />
            </div>
        </ScrollReveal>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 flex flex-col gap-12">
        <ScrollReveal direction="up">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white">Recent builds</h2>
                <p className="text-gray-500 text-sm">Discover what our community is shipping right now.</p>
            </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
            <FeedWrapper initialPosts={recentPosts || []} />
        </ScrollReveal>
      </section>
    </div>
  )
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="glass-card p-8 flex flex-col gap-4 group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-white/30 transition-all">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-4xl font-black text-white group-hover:silver-glow-text transition-all tracking-tighter">
            {value.toLocaleString()}
        </span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{label}</span>
      </div>
    </div>
  )
}
