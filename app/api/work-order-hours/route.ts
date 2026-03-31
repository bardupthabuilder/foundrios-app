import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireTenant } from '@/lib/tenant'
import { z } from 'zod'

const CreateSchema = z.object({
  work_order_id: z.string().uuid(),
  employee_id: z.string().uuid().optional().nullable(),
  employee_name: z.string().optional().nullable(),
  hours: z.number().positive(),
  hourly_rate_cents: z.number().int().min(0),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  try { await requireTenant() } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const total_cents = Math.round(parsed.data.hours * parsed.data.hourly_rate_cents)

  const { data, error } = await supabase
    .from('work_order_hours')
    .insert({ ...parsed.data, total_cents } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  try { await requireTenant() } catch { return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 }) }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID verplicht' }, { status: 400 })

  const { error } = await supabase.from('work_order_hours').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
