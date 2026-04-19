import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const service = createServiceClient() as any
  const { data } = await service.from('feedback').select('*, tenants(name)').order('created_at', { ascending: false })
  return NextResponse.json({ feedback: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  try { await requireSuperadmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }
  const body = await request.json()
  const { id, status, priority, admin_notes } = body
  if (!id) return NextResponse.json({ error: 'id verplicht' }, { status: 400 })

  const service = createServiceClient() as any
  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (priority) updates.priority = priority
  if (admin_notes !== undefined) updates.admin_notes = admin_notes

  const { data, error } = await service.from('feedback').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
