import { Database } from './database'

export type PostReaction = {
  id: string
  post_id: string
  user_id: string
  reaction: string
  created_at: string
  users?: {
    username: string
    avatar_url: string | null
    display_name: string | null
  } | null
}

export type Post = Omit<Database['public']['Tables']['posts']['Row'], 'category'> & {
  users: Database['public']['Tables']['users']['Row'] | null
  post_reactions?: PostReaction[]
  comments_count?: number
  is_priority?: boolean
  imported_from_github?: boolean
  category: Database['public']['Tables']['posts']['Row']['category'] | 'Speak'
}
