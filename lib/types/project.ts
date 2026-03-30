import type { Database } from './database.types'

// ============================================================
// Handmatige types totdat database.types.ts geregenereerd is
// Na migraties: npx supabase gen types typescript > lib/types/database.types.ts
// ============================================================

export type ProjectStatus = 'gepland' | 'actief' | 'pauze' | 'opgeleverd' | 'gefactureerd' | 'gearchiveerd'
export type ProjectType = 'vakwerk' | 'onderhoud' | 'advies' | 'service'
export type EmployeeRole = 'eigenaar' | 'voorman' | 'monteur' | 'leerling' | 'zzp'
export type TimeEntryStatus = 'ingevoerd' | 'goedgekeurd' | 'afgekeurd'

export interface Client {
  id: string
  tenant_id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  notes: string | null
  lead_id: string | null
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  tenant_id: string
  user_id: string | null
  name: string
  phone: string | null
  email: string | null
  role: EmployeeRole
  color: string
  hourly_cost_cents: number | null
  is_active: boolean
  created_at: string
}

export interface Project {
  id: string
  tenant_id: string
  client_id: string | null
  lead_id: string | null
  name: string
  description: string | null
  address: string | null
  city: string | null
  status: ProjectStatus
  project_type: ProjectType | null
  start_date: string | null
  end_date: string | null
  budget_cents: number | null
  hourly_rate_cents: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PlanningEntry {
  id: string
  tenant_id: string
  employee_id: string
  project_id: string
  planned_date: string
  start_time: string | null
  end_time: string | null
  planned_hours: number | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface TimeEntry {
  id: string
  tenant_id: string
  employee_id: string
  project_id: string
  entry_date: string
  hours: number
  start_time: string | null
  end_time: string | null
  description: string | null
  is_billable: boolean
  status: TimeEntryStatus
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface MaterialEntry {
  id: string
  tenant_id: string
  project_id: string
  employee_id: string | null
  entry_date: string
  description: string
  quantity: number
  unit: string | null
  unit_price_cents: number | null
  total_cents: number | null
  notes: string | null
  created_at: string
}

// Join types voor pagina's
export interface ProjectWithClient extends Project {
  clients: Client | null
}

export interface PlanningEntryWithDetails extends PlanningEntry {
  employees: { id: string; name: string; color: string } | null
  projects: { id: string; name: string; address: string | null; city: string | null } | null
}

export interface TimeEntryWithDetails extends TimeEntry {
  employees: { id: string; name: string } | null
  projects: { id: string; name: string } | null
}
