import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { PipelineBoard, type PipelineLead } from '@/components/dashboard/PipelineBoard'

export default async function PipelinePage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  // `NOT IN (...)` levert NULL op voor rijen zonder stage, en die vallen dan weg.
  // Expliciet NULL toelaten zodat oude leads zichtbaar blijven in 'Nieuwe aanvraag'.
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, ai_label, ai_summary, pipeline_stage, budget_estimate, phone')
    .eq('tenant_id', tenantId)
    .or('pipeline_stage.is.null,and(pipeline_stage.neq.gewonnen,pipeline_stage.neq.verloren)')
    .order('created_at', { ascending: false })

  const [{ count: wonCount }, { count: lostCount }] = await Promise.all([
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('pipeline_stage', 'gewonnen'),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('pipeline_stage', 'verloren'),
  ])

  return (
    <PipelineBoard
      initialLeads={(leads ?? []) as PipelineLead[]}
      wonCount={wonCount ?? 0}
      lostCount={lostCount ?? 0}
    />
  )
}
