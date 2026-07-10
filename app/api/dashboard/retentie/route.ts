import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Projecten opgeleverd/gefactureerd zonder ontvangen review OF met upsell kans
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, status, review_received, review_requested_at, upsell_status, clients(id, name)')
    .eq('tenant_id', tenantId)
    .in('status', ['opgeleverd', 'gefactureerd'])
    .neq('status', 'gearchiveerd')

  if (error) return NextResponse.json([], { status: 200 })

  const items = []
  for (const p of data ?? []) {
    const client = p.clients as { id: string; name: string } | null
    if (!client) continue

    if (!p.review_received) {
      items.push({
        client_id: client.id,
        client_name: client.name,
        project_id: p.id,
        project_name: p.name,
        reason: 'review_pending',
      })
    } else if (p.upsell_status && p.upsell_status !== 'none' && p.upsell_status !== 'accepted' && p.upsell_status !== 'declined') {
      items.push({
        client_id: client.id,
        client_name: client.name,
        project_id: p.id,
        project_name: p.name,
        reason: 'upsell_opportunity',
      })
    }
  }

  return NextResponse.json(items)
}
