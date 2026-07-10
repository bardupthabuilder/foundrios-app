import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const ManagedRequestSchema = z.object({
  preferred_package: z.enum(['light', 'core', 'premium', 'unsure']).default('unsure'),
  bedrijfsnaam: z.string().min(1).max(200),
  vakgebied: z.string().optional().nullable(),
  regio: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  socials: z.record(z.string(), z.string()).optional().default({}),
  omzet_maand_eur: z.number().int().nonnegative().optional().nullable(),
  gemiddelde_projectwaarde_eur: z.number().int().nonnegative().optional().nullable(),
  aantal_medewerkers: z.number().int().nonnegative().optional().nullable(),
  capaciteit_extra_werk: z.string().optional().nullable(),
  huidige_leadbronnen: z.array(z.string()).optional().default([]),
  grootste_probleem: z.string().optional().nullable(),
  gewenste_groei: z.string().optional().nullable(),
  budget_bereidheid: z.string().optional().nullable(),
})

// GET — eigen aanvragen (alle tiers mogen aanvragen)
export async function GET() {
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('managed_requests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — nieuwe aanvraag indienen
export async function POST(request: NextRequest) {
  let tenantId: string
  let userId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
    userId = t.userId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = ManagedRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('managed_requests')
    .insert({
      ...parsed.data,
      tenant_id: tenantId,
      requester_user_id: userId,
      status: 'new',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
