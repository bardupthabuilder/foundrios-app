import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

// Alleen deze velden mogen bijgewerkt worden. Een ongefilterde body zou
// tenant_id kunnen meesturen en de campagne naar een andere tenant verplaatsen.
const UpdateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  area: z.string().max(200).nullable().optional(),
  discount_pct: z.number().int().min(0).max(100).optional(),
  valid_until: z.string().nullable().optional(),
  message_template: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  leads_generated: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = UpdateCampaignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('campaigns' as any)
    .update(parsed.data as any)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
