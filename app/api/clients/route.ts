import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { enforceLimit } from '@/lib/limits'
import { z } from 'zod'

const CreateClientSchema = z.object({
  name: z.string().min(1).max(200),
  contact_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('clients')
    // Betaalde facturen en laatste klus meesturen. Zonder deze twee is de
    // klantenlijst een adresboek; mét deze twee weet je wie je moet bellen
    // voor onderhoud of een vervolgopdracht.
    .select('*, invoices(amount_incl_vat, amount_excl_vat, status, paid_at), projects(id, name, status, end_date, created_at)')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (data ?? []).map((client: any) => {
    const paid = (client.invoices ?? []).filter((i: any) => i.status === 'paid')
    const totalSpentCents = paid.reduce(
      (sum: number, i: any) => sum + (i.amount_incl_vat ?? i.amount_excl_vat ?? 0), 0
    )

    const projects = (client.projects ?? []) as any[]
    const lastProject = projects
      .slice()
      .sort((a, b) => new Date(b.end_date ?? b.created_at).getTime() - new Date(a.end_date ?? a.created_at).getTime())[0]

    const lastActivity = lastProject?.end_date ?? lastProject?.created_at ?? null
    const daysSinceLastJob = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : null

    return {
      ...client,
      total_spent_cents: totalSpentCents,
      project_count: projects.length,
      last_project: lastProject ? { id: lastProject.id, name: lastProject.name } : null,
      days_since_last_job: daysSinceLastJob,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let tenantId: string
  try {
    const t = await requireTenant()
    tenantId = t.tenantId
  } catch {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateClientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const limitResponse = await enforceLimit(tenantId, 'clients')
  if (limitResponse) return limitResponse

  const { name, ...rest } = parsed.data
  const { data, error } = await supabase
    .from('clients')
    .insert({ tenant_id: tenantId, company_name: name, name, ...rest } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
