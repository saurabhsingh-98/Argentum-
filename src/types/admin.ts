import { Database, Json } from './database'

export type AdminAuditLog = {
  id: string
  created_at: string
  admin_id: string
  action: string
  target_type: string
  target_id: string
  details: Json
  ip_address: string | null
}

export type SecurityAlert = {
  id: string
  created_at: string
  type: string
  details: Json
  ip_address: string
  resolved: boolean
  user_id: string | null
}

export type IssueReport = {
  id: string
  created_at: string
  user_id: string
  title: string
  description: string
  status: 'open' | 'closed'
  updated_at: string | null
}

export type StatusUpdate = Database['public']['Tables']['notifications']['Row'] & {
  // This might be different but notifications table has similar fields.
  // Actually, status_updates is likely its own table.
}

// Refining for the actual usage in admin views
export type AdminAuditLogWithUser = AdminAuditLog & {
  users: { username: string; avatar_url: string | null } | null
}

export type SecurityAlertWithUser = SecurityAlert & {
  users: { username: string; display_name: string | null } | null
}

export type IssueReportWithUser = IssueReport & {
  users: { username: string; display_name: string | null } | null
}

export type UserWithAdminFields = Database['public']['Tables']['users']['Row'] & {
  email?: string
  is_admin?: boolean
  is_banned?: boolean
  ban_reason?: string | null
  banned_until?: string | null
  banned_at?: string | null
}
