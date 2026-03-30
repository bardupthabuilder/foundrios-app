import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateEmployeeSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: z.enum(['eigenaar', 'voorman', 'monteur', 'leerling', 'zzp']).default('monteur'),
  color: z.string().default('#6366f1'),
  hourly_cost_cents: z.number().int().optional().nullable(),
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
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
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
  const parsed = CreateEmployeeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, ...rest } = parsed.data
  const { data, error } = await supabase
    .from('employees')
    .insert({ tenant_id: tenantId, full_name: name, name, ...rest } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
