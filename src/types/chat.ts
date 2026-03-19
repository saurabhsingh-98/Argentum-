import { Database } from './database'

export type ChatUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  public_key: string | null
  is_online?: boolean
  last_seen?: string | null
}

export type ChatMessage = Database['public']['Tables']['messages']['Row']

export type MessageReaction = Database['public']['Tables']['message_reactions']['Row']

export type MessageWithReactions = Database['public']['Tables']['messages']['Row'] & {
  message_reactions?: MessageReaction[]
  decryptedContent?: string
  expired?: boolean | null
  is_edited?: boolean
  attachment_url?: string | null
  attachment_type?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
}

export type ConversationWithParticipants = Database['public']['Tables']['conversations']['Row'] & {
  participant_1_profile: ChatUser
  participant_2_profile: ChatUser
  messages: ChatMessage[]
}

export type ProcessedConversation = ConversationWithParticipants & {
  otherParticipant: ChatUser
  lastMessagePreview: string
  lastMessageTime: Date | null
}
