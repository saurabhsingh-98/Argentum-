export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          github_username: string | null
          x_handle: string | null
          website_url: string | null
          hbar_wallet: string | null
          streak_count: number
          currently_building: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_username?: string | null
          x_handle?: string | null
          website_url?: string | null
          hbar_wallet?: string | null
          streak_count?: number
          currently_building?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_username?: string | null
          x_handle?: string | null
          website_url?: string | null
          hbar_wallet?: string | null
          streak_count?: number
          currently_building?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          content_hash: string | null
          status: 'draft' | 'published' | 'private'
          category: 'Web3' | 'AI' | 'Mobile' | 'DevTools' | 'Game' | 'Other' | null
          tags: string[]
          upvotes: number
          nft_token_id: string | null
          hcs_sequence_num: number | null
          verification_status: 'unverified' | 'pending' | 'verified'
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          content_hash?: string | null
          status?: 'draft' | 'published' | 'private'
          category?: 'Web3' | 'AI' | 'Mobile' | 'DevTools' | 'Game' | 'Other' | null
          tags?: string[]
          upvotes?: number
          nft_token_id?: string | null
          hcs_sequence_num?: number | null
          verification_status?: 'unverified' | 'pending' | 'verified'
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          content_hash?: string | null
          status?: 'draft' | 'published' | 'private'
          category?: 'Web3' | 'AI' | 'Mobile' | 'DevTools' | 'Game' | 'Other' | null
          tags?: string[]
          upvotes?: number
          nft_token_id?: string | null
          hcs_sequence_num?: number | null
          verification_status?: 'unverified' | 'pending' | 'verified'
          verified_at?: string | null
          created_at?: string
        }
      }
      upvotes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Functions: {
      increment_upvotes: {
        Args: { post_id_input: string }
        Returns: void
      }
      decrement_upvotes: {
        Args: { post_id_input: string }
        Returns: void
      }
    }
  }
}
