import type { Database } from './database.types'

export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']
export type LeadMessage = Database['public']['Tables']['lead_messages']['Row']
export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantUser = Database['public']['Tables']['tenant_users']['Row']

export type LeadStatus = Lead['status']
export type LeadSource = NonNullable<Lead['source']>
export type LeadLabel = NonNullable<Lead['ai_label']>

export interface LeadWithMessages extends Lead {
  lead_messages: LeadMessage[]
  lead_events: LeadEvent[]
}

export interface AiScoreResult {
  score: number
  label: 'hot' | 'warm' | 'cold'
  summary: string
  budget_estimate: string | null
  urgency: 'low' | 'medium' | 'high'
  intent: string
}
