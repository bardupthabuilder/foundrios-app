import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export type StageKind = 'open' | 'qualified' | 'nurture' | 'disqualified' | 'closed'

export interface PipelineStage {
  id: string
  tenant_id: string
  key: string
  label: string
  kind: StageKind
  sort_order: number
}

export const DEFAULT_STAGES: { key: string; label: string; kind: StageKind; sort_order: number }[] = [
  { key: 'nieuw', label: 'Nieuw', kind: 'open', sort_order: 0 },
  { key: 'contact_gelegd', label: 'Contact gelegd', kind: 'open', sort_order: 1 },
  { key: 'in_gesprek', label: 'In gesprek', kind: 'open', sort_order: 2 },
  { key: 'wacht_op_info', label: "Wacht op info/foto's", kind: 'open', sort_order: 3 },
  { key: 'gekwalificeerd', label: 'Gekwalificeerd', kind: 'qualified', sort_order: 4 },
  { key: 'niet_gekwalificeerd', label: 'Niet gekwalificeerd', kind: 'disqualified', sort_order: 5 },
  { key: 'nurture', label: 'Nurture', kind: 'nurture', sort_order: 6 },
  { key: 'gesloten', label: 'Gesloten', kind: 'closed', sort_order: 7 },
]

/** Haalt de pipeline-stages van een tenant op; zaait de defaults als er nog geen zijn. */
export async function getPipelineStages(supabase: AnySupabaseClient, tenantId: string): Promise<PipelineStage[]> {
  const { data } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (data && data.length > 0) return data as PipelineStage[]

  const { data: seeded } = await supabase
    .from('pipeline_stages')
    .insert(DEFAULT_STAGES.map((s) => ({ ...s, tenant_id: tenantId })))
    .select('*')
    .order('sort_order', { ascending: true })

  return (seeded ?? []) as PipelineStage[]
}

export function keysByKind(stages: PipelineStage[], kind: StageKind): string[] {
  return stages.filter((s) => s.kind === kind).map((s) => s.key)
}

/** Stages die als "open/actief" gelden — alles behalve gesloten en niet-gekwalificeerd. */
export function openStageKeys(stages: PipelineStage[]): string[] {
  return stages.filter((s) => s.kind !== 'closed' && s.kind !== 'disqualified').map((s) => s.key)
}
