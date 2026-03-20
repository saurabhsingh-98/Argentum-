import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewPostClient from './NewPostClient'

export default async function NewPostPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <NewPostClient initialUser={user} />
}
