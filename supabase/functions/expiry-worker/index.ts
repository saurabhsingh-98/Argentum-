import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const startTime = new Date().toISOString()

  try {
    // Find expired messages
    const { data: expiredMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString())

    if (fetchError) {
      console.error(`[${startTime}] Expiry worker fetch error:`, fetchError.message)
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
    }

    if (!expiredMessages || expiredMessages.length === 0) {
      console.log(`[${startTime}] Expiry worker: no expired messages found`)
      return new Response(JSON.stringify({ deleted: 0, timestamp: startTime }), { status: 200 })
    }

    const ids = expiredMessages.map((m: { id: string }) => m.id)

    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .in('id', ids)

    if (deleteError) {
      console.error(`[${startTime}] Expiry worker delete error:`, deleteError.message)
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
    }

    console.log(`[${startTime}] Expiry worker: deleted ${ids.length} expired messages`)
    return new Response(JSON.stringify({ deleted: ids.length, timestamp: startTime }), { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[${startTime}] Expiry worker unexpected error:`, message)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})
