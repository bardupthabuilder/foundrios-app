import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  campaign_type: z.enum(['burenactie', 'seizoensactie', 'upsell', 'referral', 'custom']),
  project_id: z.string().uuid().optional().nullable(),
  area: z.string().max(200).optional().nullable(),
  discount_pct: z.number().int().min(0).max(100).default(0),
  valid_until: z.string().optional().nullable(),
  message_template: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { data, error } = await supabase
    .from('campaigns' as any)
    .select('*, projects(id, name, city)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try { tenantId = (await requireTenant()).tenantId } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = CreateCampaignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // tenant_id ná de payload zetten: anders kan een meegestuurde tenant_id hem overschrijven.
  const { data, error } = await supabase
    .from('campaigns' as any)
    .insert({ ...parsed.data, tenant_id: tenantId, status: 'draft' } as any)
    .select('*, projects(id, name, city)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
