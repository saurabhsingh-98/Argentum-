// Build trigger: standardized routing and visibility updates
import { createClient } from '@/lib/supabase/server'
import FeedWithFilter from '@/components/FeedWithFilter'
import ScrollReveal from '@/components/ScrollReveal'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: posts, count } = await supabase
    .from('posts')
    .select('*, users(id, username, display_name, avatar_url, bio, currently_building, twitter_username)', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-[#050505] py-12 md:py-24">
      <div className="container mx-auto px-4 flex flex-col gap-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div className="flex flex-col gap-2">
            <ScrollReveal direction="down">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Feed</h1>
            </ScrollReveal>
            <p className="text-gray-500 text-sm">Real-time build logs from the community.</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
            <span className="text-xl font-black text-white">{count || 0}</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Logs</span>
          </div>
        </header>

        <section>
          <FeedWithFilter initialPosts={posts || []} />
        </section>
      </div>
    </div>
  )
}
