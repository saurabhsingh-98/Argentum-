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
          instagram_username: string | null
          website_url: string | null
          hbar_wallet: string | null
          streak_count: number
          currently_building: string | null
          is_public: boolean
          skills: string[]
          open_to_work: boolean
          looking_for: string | null
          pinned_post_id: string | null
          public_key: string | null
          encrypted_private_key: string | null
          key_backup_method: string
          key_backup_hint: string | null
          key_backup_created_at: string | null
          last_seen: string | null
          is_online: boolean
          user_type: 'builder' | 'company'
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_username?: string | null
          instagram_username?: string | null
          website_url?: string | null
          hbar_wallet?: string | null
          streak_count?: number
          currently_building?: string | null
          is_public?: boolean
          skills?: string[]
          open_to_work?: boolean
          looking_for?: string | null
          pinned_post_id?: string | null
          public_key?: string | null
          encrypted_private_key?: string | null
          key_backup_method?: string
          key_backup_hint?: string | null
          key_backup_created_at?: string | null
          last_seen?: string | null
          is_online?: boolean
          user_type?: 'builder' | 'company'
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_username?: string | null
          instagram_username?: string | null
          website_url?: string | null
          hbar_wallet?: string | null
          streak_count?: number
          currently_building?: string | null
          is_public?: boolean
          skills?: string[]
          open_to_work?: boolean
          looking_for?: string | null
          pinned_post_id?: string | null
          public_key?: string | null
          encrypted_private_key?: string | null
          key_backup_method?: string
          key_backup_hint?: string | null
          key_backup_created_at?: string | null
          last_seen?: string | null
          is_online?: boolean
          user_type?: 'builder' | 'company'
          is_verified?: boolean
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
          category: 'Web3' | 'AI' | 'Mobile' | 'DevTools' | 'Game' | 'Other' | 'Speak' | null
          is_priority: boolean | null
          tags: string[]
          upvotes: number
          nft_token_id: string | null
          hcs_sequence_num: number | null
          verification_status: 'unverified' | 'pending' | 'verified'
          verified_at: string | null
          is_collab: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          content_hash?: string | null
          status?: 'draft' | 'published' | 'private'
          category?: 'Web3' | 'AI' | 'Mobile' | 'DevTools' | 'Game' | 'Other' | 'Speak' | null
          is_priority?: boolean | null
          tags?: string[]
          upvotes?: number
          nft_token_id?: string | null
          hcs_sequence_num?: number | null
          verification_status?: 'unverified' | 'pending' | 'verified'
          verified_at?: string | null
          is_collab?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          content_hash?: string | null
          status?: 'draft' | 'published' | 'private'
          category?: 'Web3' | 'AI' | 'Mobile' | 'DevTools' | 'Game' | 'Other' | 'Speak' | null
          is_priority?: boolean | null
          tags?: string[]
          upvotes?: number
          nft_token_id?: string | null
          hcs_sequence_num?: number | null
          verification_status?: 'unverified' | 'pending' | 'verified'
          verified_at?: string | null
          is_collab?: boolean
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
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          disappearing_messages: 'off' | '24h' | '7d' | 'lifetime'
          muted_until: Json
          created_at: string
        }
        Insert: {
          id?: string
          participant_1: string
          participant_2: string
          disappearing_messages?: 'off' | '24h' | '7d' | 'lifetime'
          muted_until?: Json
          created_at?: string
        }
        Update: {
          id?: string
          participant_1?: string
          participant_2?: string
          disappearing_messages?: 'off' | '24h' | '7d' | 'lifetime'
          muted_until?: Json
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          expires_at: string | null
          read_at: string | null
          deleted_for: string[]
          is_edited: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          expires_at?: string | null
          read_at?: string | null
          deleted_for?: string[]
          is_edited?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          expires_at?: string | null
          read_at?: string | null
          deleted_for?: string[]
          is_edited?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          from_user_id: string
          type: 'upvote' | 'comment' | 'follow' | 'message' | 'verified'
          content: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_user_id: string
          type: 'upvote' | 'comment' | 'follow' | 'message' | 'verified'
          content: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_user_id?: string
          type?: 'upvote' | 'comment' | 'follow' | 'message' | 'verified'
          content?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      streak_history: {
        Row: {
          id: string
          user_id: string
          post_date: string
          post_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_date: string
          post_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_date?: string
          post_count?: number
          created_at?: string
        }
      }
      issue_reports: {
        Row: {
          id: string
          user_id: string
          title: string | null
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: string
          target_id: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string
          target_id?: string
          created_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription?: string
          created_at?: string
          updated_at?: string
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
