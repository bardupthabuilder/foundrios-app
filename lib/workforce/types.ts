// Foundri Workforce — Core Types

export type LeadStatus = 'new' | 'qualified' | 'conversation' | 'booking' | 'booked' | 'rejected' | 'reactivation'
export type Qualification = 'hot' | 'warm' | 'cold' | 'reject'
export type KnowledgeCategory = 'services' | 'regions' | 'pricing' | 'faq' | 'company_info'
export type AgentRunStatus = 'running' | 'success' | 'error' | 'fallback'
export type AgentModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6-20250514'

export interface FwTenant {
  id: string
  name: string
  slug: string
  niche: string | null
  region: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface FwLead {
  id: string
  tenant_id: string
  status: LeadStatus
  qualification: Qualification | null
  source: string | null
  raw_data: Record<string, unknown> | null
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  service: string | null
  region: string | null
  budget: string | null
  urgency: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface FwAgentRun {
  id: string
  tenant_id: string
  lead_id: string | null
  agent_name: string
  agent_version: string
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  tools_called: ToolCall[]
  tokens_input: number | null
  tokens_output: number | null
  model: string | null
  duration_ms: number | null
  status: AgentRunStatus
  error: string | null
  created_at: string
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  output: unknown
}

export interface FwKnowledgeItem {
  id: string
  tenant_id: string
  category: KnowledgeCategory
  title: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Agent Runtime Types
export interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>

export interface AgentSpec {
  name: string
  version: string
  model: AgentModel
  system: string
  tools: ToolDefinition[]
  toolHandlers: Record<string, ToolHandler>
  maxTokens: number
}

export interface AgentContext {
  tenantId: string
  leadId?: string
}

export interface AgentResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  runId: string
}
